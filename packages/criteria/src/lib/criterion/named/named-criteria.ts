import { Criteria } from "../criteria";
import { Criterion } from "../criterion";
import { OrCriteria } from "../or/or-criteria";

export type NamedCriteriaBag = Record<string, Criterion | undefined>;

export class NamedCriteria<T extends NamedCriteriaBag = NamedCriteriaBag> extends Criterion {
    constructor(items: T) {
        super();

        if (Object.keys(items).length === 0) {
            throw new Error(`can not create empty named criteria`);
        }

        this.bag = Object.freeze(items);
    }

    readonly bag: Readonly<Partial<T>>;

    getBag(): Readonly<Partial<T>> {
        return this.bag;
    }

    reduce(other: Criterion): boolean | Criterion {
        if (other instanceof Criteria) {
            return other.reduceBy(this);
        } else if (other instanceof NamedCriteria) {
            // same reduction mechanics as found in and-criteria.ts
            const otherBag = other.getBag();
            const reductions: {
                criterion: Criterion;
                result: Criterion | boolean;
                key: string;
                inverted?: Criterion;
            }[] = [];

            for (const key in this.bag) {
                const mine = this.bag[key];

                if (mine === void 0) {
                    continue;
                }

                // [todo] is any? seems like i broke it without realizing during implementation of criterion templates
                const otherCriterion = otherBag[key];

                if (otherCriterion === void 0) {
                    const inverted = mine.invert();

                    if (inverted === false) {
                        return false;
                    }

                    reductions.push({ criterion: mine, key, result: false, inverted });
                } else {
                    const result = mine.reduce(otherCriterion);

                    if (result === false) {
                        return false;
                    }

                    reductions.push({ criterion: mine, key, result });
                }
            }

            if (reductions.every(x => x.result === false)) {
                return false;
            } else if (reductions.every(x => x.result === true)) {
                return true;
            }

            // we want items that did an actual reduction to be put first
            reductions.sort((a, b) => {
                if (a.result !== false && b.result === false) {
                    return -1;
                } else if (a.result === false && b.result !== false) {
                    return 1;
                } else {
                    return 0;
                }
            });

            const accumulator = { ...other.getBag() };
            const built: Record<string, Criterion>[] = [];

            for (const { criterion, key, result, inverted } of reductions) {
                if (result === true) {
                    continue;
                }

                const reduced = result === false ? inverted ?? criterion.invert() : result;

                if (reduced === false) {
                    return false;
                }

                built.push({ ...accumulator, [key]: reduced });
                accumulator[key] = this.bag[key];
            }

            return built.length === 1
                ? new NamedCriteria(built[0])
                : new OrCriteria(built.map(bag => new NamedCriteria(bag)));
        }

        return false;
    }

    override invert(): Criterion {
        // [todo] implement
        throw new Error("not implemented yet");
    }

    toString(): string {
        const shards: string[] = [];

        for (const key in this.bag) {
            const criteria = this.bag[key];
            if (criteria === void 0) continue;

            shards.push(`${key}: ${criteria.toString()}`);
        }

        return `{ ${shards.join(", ")} }`;
    }

    matches(item: any): boolean {
        for (const key in this.bag) {
            const criterion = this.bag[key];

            if (!criterion?.matches(item[key])) {
                return false;
            }
        }

        return true;
    }

    override merge(other: Criterion): false | Criterion {
        if (other.reduce(this) === true) {
            return other;
        } else if (this.reduce(other) === true) {
            return this;
        } else if (other instanceof Criteria) {
            return other.merge(this);
        } else if (other instanceof NamedCriteria) {
            const mergedBag: Record<string, Criterion> = {};
            const otherBag = other.getBag();
            let mergedOne = false;

            for (const key in this.bag) {
                const myBagCriterion = this.bag[key];
                // [todo] is any? seems like i broke it without realizing during implementation of criterion templates
                const otherBagCriterion = otherBag[key];

                if (myBagCriterion === void 0) {
                    if (otherBagCriterion !== void 0) {
                        return false;
                    }

                    continue;
                } else if (otherBagCriterion === void 0) {
                    return false;
                } else {
                    const mergedResult = myBagCriterion.merge(otherBagCriterion);

                    if (mergedResult === false) {
                        return false;
                    }

                    const isMineSubsetOfOther = myBagCriterion.reduce(otherBagCriterion) === true;
                    const isOtherSubsetOfMine = otherBagCriterion.reduce(myBagCriterion) === true;

                    if (!(isMineSubsetOfOther && isOtherSubsetOfMine)) {
                        if (mergedOne) {
                            return false;
                        }

                        mergedOne = true;
                    }

                    mergedBag[key] = mergedResult;
                }
            }

            return new NamedCriteria(mergedBag);
        } else {
            return false;
        }
    }
}

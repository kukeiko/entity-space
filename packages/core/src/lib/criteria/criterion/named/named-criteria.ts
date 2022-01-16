import { permutateEntries } from "@entity-space/utils";
import { NamedCriteriaTemplate } from ".";
import { CriterionTemplate } from "..";
import { Criteria } from "../criteria";
import { Criterion } from "../criterion";
import { OrCriteria, OrCriteriaTemplate } from "../or";

export type NamedCriteriaBag = Record<string, Criterion>;

export class NamedCriteria<T extends NamedCriteriaBag = NamedCriteriaBag> extends Criterion {
    constructor(items: Partial<T>) {
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

    invert(): Criterion {
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

    remapOne(template: CriterionTemplate): [false, undefined] | [Criterion[], Criterion?] {
        if (template instanceof NamedCriteriaTemplate) {
            const openBag = { ...this.getBag() } as NamedCriteriaBag;
            const otherBag = template.items;
            const theBagToPermutate: Record<string, Criterion[]> = {};

            for (const key in otherBag) {
                const criterion = openBag[key];

                if (criterion == void 0) {
                    continue;
                }

                const templates = otherBag[key];

                // [todo] what to do with "open"?
                const [remapped, open] = criterion.remap(templates);

                if (remapped === false) {
                    continue;
                }

                theBagToPermutate[key] = remapped;
            }

            if (Object.keys(theBagToPermutate).length > 0) {
                const permutations = permutateEntries(theBagToPermutate);
                return [permutations.map(bag => new NamedCriteria(bag))];
            }
        } else if (
            template instanceof OrCriteriaTemplate &&
            template.items.some(item => item instanceof NamedCriteriaTemplate)
        ) {
            // [todo] i was clearly having some plan here
        }

        return [false, void 0];
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

    merge(other: Criterion): false | Criterion {
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

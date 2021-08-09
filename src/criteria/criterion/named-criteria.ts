import { OrCriteria } from "./or-criteria";
import { Criteria } from "./criteria";
import { Criterion } from "./criterion";

export class NamedCriteria<T extends Record<string, Criterion>> extends Criterion {
    constructor(items: T) {
        super();

        if (Object.keys(items).length === 0) {
            throw new Error(`can not create empty named criteria`);
        }

        this.bag = Object.freeze(items);
    }

    readonly bag: Readonly<T>;

    getBag(): Readonly<T> {
        return this.bag;
    }

    reduce(other: Criterion): boolean | Criterion {
        if (other instanceof Criteria) {
            return other.reduceBy(this);
        } else if (other instanceof NamedCriteria) {
            // same reduction mechanics as found in and-criteria.ts
            const otherBag = other.getBag();
            const reductions: { criterion: Criterion; result: Criterion | boolean; key: string; inverted?: Criterion }[] = [];

            for (const key in this.bag) {
                const mine = this.bag[key];

                if (mine === void 0) {
                    continue;
                }

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
            const myBag: Record<string, Criterion> = this.bag;

            for (const { criterion, key, result, inverted } of reductions) {
                if (result === true) {
                    continue;
                }

                const reduced = result === false ? inverted ?? criterion.invert() : result;

                if (reduced === false) {
                    return false;
                }

                built.push({ ...accumulator, [key]: reduced });
                accumulator[key] = myBag[key];
            }

            return built.length === 1 ? new NamedCriteria(built[0]) : new OrCriteria(built.map(bag => new NamedCriteria(bag)));
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
}

import { Class, getInstanceClass, permutateEntries } from "../../utils";
import { OrCriteria } from "./or-criteria";
import { Criteria } from "./criteria";
import { Criterion } from "./criterion";

type RemapTemplate<T> = {
    [K in keyof T]?: Exclude<T[K], undefined> extends boolean | number | string | null ? Class<Criterion> | Class<Criterion>[] : never;
};

type InstantiatedTemplate<T> = {
    [K in keyof T]?: T[K] extends Class<Criterion>[] ? InstanceType<T[K][number]>[] : T[K] extends Class<Criterion> ? InstanceType<T[K]> : never;
};

export type CriterionBag<T = any> = {
    [K in keyof T]?: Criterion;
};

// [todo] rename to ObjectCriterion
// [todo] or rename to PropertyCriteria
export class PropertyCriteria<T = any> extends Criterion {
    constructor(items: CriterionBag<T>) {
        super();

        if (Object.keys(items).length === 0) {
            throw new Error(`can not create empty property criteria`);
        }

        this.bag = Object.freeze(items);
    }

    readonly bag: Readonly<CriterionBag<T>>;

    getBag(): Readonly<CriterionBag<T>> {
        return this.bag;
    }

    // [todo] need to recursively get entries from nested ObjectCriterions
    getEntries(): [string, Criterion[]][] {
        const entries: [string, Criterion[]][] = [];
        const bag = this.getBag();

        for (const key in bag) {
            const valueCriteria = bag[key];
            if (valueCriteria === void 0) {
                continue;
            } else if (valueCriteria instanceof OrCriteria) {
                entries.push([key, valueCriteria.getItems()]);
            } else {
                entries.push([key, [valueCriteria]]);
            }
        }

        return entries;
    }

    remap<U extends RemapTemplate<T>>(handler: () => U): InstantiatedTemplate<U>[] {
        const entries = this.getEntries();
        const permutationEntries: [string, any[]][] = [];
        const template = handler();

        for (const key in template) {
            const entry = entries.find(([entryKey]) => entryKey === key);
            if (!entry) continue;

            const stuffInTemplate = template[key];
            const allowedTypes = Array.isArray(stuffInTemplate) ? stuffInTemplate : ([stuffInTemplate] as any[]);
            const filteredByType = entry[1].filter(item => allowedTypes.includes(getInstanceClass(item)));

            if (Array.isArray(stuffInTemplate)) {
                permutationEntries.push([key, [filteredByType]]);
            } else {
                permutationEntries.push([key, filteredByType]);
            }
        }

        return permutateEntries(permutationEntries) as any;
    }

    reduce(other: Criterion): boolean | Criterion {
        if (other instanceof Criteria) {
            return other.reduceBy(this);
        } else if (other instanceof PropertyCriteria) {
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
            const built: CriterionBag[] = [];
            const myBag: CriterionBag = this.bag;

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

            return built.length === 1 ? new PropertyCriteria(built[0]) : new OrCriteria(built.map(bag => new PropertyCriteria(bag)));
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

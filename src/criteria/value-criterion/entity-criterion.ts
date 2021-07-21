import { Class, getInstanceClass } from "../../utils";

import { OrCombinedValueCriteria } from "./or-combined-value-criteria";
import { ValueCriteria } from "./value-criteria";
import { ValueCriterion } from "./value-criterion";

type RemapTemplate<T> = {
    [K in keyof T]?: Exclude<T[K], undefined> extends boolean | number | string | null ? Class<ValueCriterion<T[K]>> | Class<ValueCriterion<T[K]>>[] : never;
};

type InstantiatedTemplate<T> = {
    [K in keyof T]?: T[K] extends Class<ValueCriterion>[] ? InstanceType<T[K][number]>[] : T[K] extends Class<ValueCriterion> ? InstanceType<T[K]> : never;
};

// [todo] move to utils once i've cleaned up the "any"s
function permutate(aggregated: any, entries: [string, any[]][]): any[] {
    if (entries.length === 0) {
        return [aggregated];
    }

    let allAggregated: any[] = [];
    let [key, shards] = entries[0];
    entries = entries.slice(1);
    aggregated = { ...aggregated };

    for (const shard of shards) {
        let nextAggregated = { ...aggregated, [key]: shard };
        allAggregated.push(...permutate(nextAggregated, entries));
    }

    return allAggregated;
}

export class EntityCriterion<T = unknown> extends ValueCriterion<T> {
    constructor(items: Partial<Record<keyof T, ValueCriterion>>) {
        super();
        this.bag = items;
    }

    readonly bag: Partial<Record<keyof T, ValueCriterion>>;

    getBag(): Partial<Record<keyof T, ValueCriterion>> {
        return this.bag;
    }

    // [todo] need to recursively get entries from nested ObjectCriterions
    getEntries(): [string, ValueCriterion[]][] {
        const entries: [string, ValueCriterion[]][] = [];
        const bag = this.getBag();

        for (const key in bag) {
            const valueCriteria = bag[key];
            if (valueCriteria === void 0 || !(valueCriteria instanceof ValueCriteria)) {
                continue;
            }

            entries.push([key, valueCriteria.getItems()]);
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

        return permutate({}, permutationEntries);
    }

    // [todo] remove "as any" hacks
    reduce(other: ValueCriterion): boolean | ValueCriterion<T> {
        if (other instanceof ValueCriteria) {
            return super.reduceValueCriteria(other);
        } else if (other instanceof EntityCriterion) {
            const reducedPropertyCriteriaBag = new Map<string, ValueCriterion>();

            for (const key in this.bag) {
                const myCriterion = this.bag[key];

                if (myCriterion === void 0) {
                    continue;
                }

                const otherCriterion = other.bag[key];
                let reduced: ValueCriterion | boolean = false;

                if (otherCriterion === void 0) {
                    reduced = myCriterion.invert();

                    // [B] has criteria [A] doesn't, and we weren't able to compute the inversion of them => return [A] as is
                    // [todo] currently can't happen - for now we can invert all the value criteria we have. so maybe remove it?
                    if (reduced === myCriterion) {
                        return false;
                    }
                } else {
                    reduced = myCriterion.reduce(otherCriterion);
                }

                if (reduced === false) {
                    return false;
                } else if (reduced !== true) {
                    reducedPropertyCriteriaBag.set(key, reduced);
                }
            }

            if (reducedPropertyCriteriaBag.size == 0) {
                return true;
            }

            const objectCriterion: Record<string, ValueCriterion> = {};

            // [todo] i think there is an Object.fromEntries() method that we could use, but we need to upgrade our ES target @ tsconfigs
            for (const [key, reducedPropertyCriteria] of Object.entries(other.bag)) {
                objectCriterion[key] = reducedPropertyCriteria as any;
            }

            const objectCriteria: Record<string, ValueCriterion>[] = [];

            for (const [key, reducedPropertyCriteria] of reducedPropertyCriteriaBag) {
                objectCriteria.push({ ...objectCriterion, [key]: reducedPropertyCriteria });
                objectCriterion[key] = (this.bag as any)[key];
            }

            const entityCriterionPieces = objectCriteria.map(criteria => new EntityCriterion(criteria));

            if (entityCriterionPieces.length === 1) {
                return entityCriterionPieces[0] as any;
            }

            return new OrCombinedValueCriteria(entityCriterionPieces) as any;
        }

        return false;
    }

    invert(): ValueCriterion<T> {
        throw new Error("not implemented yet");
    }

    toString(): string {
        const shards: string[] = [];

        for (const key in this.bag) {
            const criteria = this.bag[key];

            // [todo] this check only exists because i wanted typed ObjectCriterion to not require specifying a critera on each keyof T
            // seems kinda unclean, so revisit on how to do it better
            if (criteria === void 0) continue;

            shards.push(`${key}: ${criteria.toString()}`);
        }

        return `{ ${shards.join(" & ")} }`;
    }
}

import { Class, getInstanceClass } from "../../utils";
import { isValuesCriteria } from "../values-criterion";
import { EntityCriteria } from "./entity-criteria";
import { ValueCriteria } from "./value-criteria";
import { ValueCriterion } from "./value-criterion";

type PropertyCriteria<T = unknown> = T extends boolean | number | string | null ? ValueCriteria<T> : EntityCriteria<T>;

export type PropertyCriteriaBag<T> = {
    [K in keyof T]?: Exclude<T[K], undefined> extends boolean | number | string | null ? ValueCriteria<T[K]> : EntityCriteria<T[K]>;
};

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

export class EntityCriterion<T = unknown> {
    constructor(items: PropertyCriteriaBag<T>) {
        this.bag = items;
    }

    readonly bag: PropertyCriteriaBag<T>;

    getBag(): PropertyCriteriaBag<T> {
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
    reduce(other: EntityCriterion<T>): EntityCriteria<T> | false {
        const reducedPropertyCriteriaBag = new Map<string, PropertyCriteria<T>>();

        for (const key in this.bag) {
            const criteriaA = other.bag[key];
            const criteriaB = this.bag[key];
            let reduced: PropertyCriteria<T[typeof key]> | false = false;

            /**
             * [todo] need "invertCriterion()" for this case
             */
            if (criteriaA === void 0) {
                // if (criteriaB instanceof ValueCriteria) {
                if (criteriaB instanceof ValueCriterion) {
                    reduced = criteriaB.invert() as any;

                    // [B] has criteria [A] doesn't, and we weren't able to compute the inversion of them => return [A] as is
                    // [todo] currently can't happen - for now we can invert all the value criteria we have. so maybe remove it?
                    if (reduced === criteriaB) {
                        return false;
                    }
                } else {
                    /**
                     * [todo] implement inversion of all types of criteria
                     */
                    return false;
                }
                // } else if (criteriaB instanceof ValueCriteria) {
            } else if (criteriaB instanceof ValueCriterion) {
                // if (criteriaA instanceof ValueCriteria) {
                if (criteriaA instanceof ValueCriterion) {
                    reduced = criteriaB.reduce(criteriaA) as any;
                } else {
                    throw new Error("trying to reduce two criteria of different types");
                }
            } else if (isValuesCriteria(criteriaB)) {
                throw new Error("ValuesCriteria reduction not yet implemented");
            } else if (criteriaB instanceof EntityCriteria) {
                if (criteriaA instanceof ValueCriteria) {
                    throw new Error("trying to reduce two criteria of different types");
                } else if (isValuesCriteria(criteriaA)) {
                    throw new Error("trying to reduce two criteria of different types");
                } else if (criteriaA instanceof EntityCriteria) {
                    reduced = criteriaB.reduce(criteriaA) as any;
                }
            }

            if (!reduced) {
                /**
                 * failed to reduce a property of [A] => no intersection => return [A] as is
                 */
                return false;
                // } else if ((reduced as any) !== true && reduced.items.length > 0) {
            } else if ((reduced as any) !== true) {
                reducedPropertyCriteriaBag.set(key, reduced as any);
            }
        }

        if (reducedPropertyCriteriaBag.size == 0) {
            // return true;
            return new EntityCriteria([]);
        }

        const objectCriterion: Record<string, PropertyCriteria> = {};

        // [todo] i think there is an Object.fromEntries() method that we could use, but we need to upgrade our ES target @ tsconfigs
        for (const [key, reducedPropertyCriteria] of Object.entries(other.bag)) {
            objectCriterion[key] = reducedPropertyCriteria as any;
        }

        const objectCriteria: Record<string, PropertyCriteria>[] = [];

        for (const [key, reducedPropertyCriteria] of reducedPropertyCriteriaBag) {
            objectCriteria.push({ ...objectCriterion, [key]: reducedPropertyCriteria } as any);
            objectCriterion[key] = (this.bag as any)[key];
        }

        return new EntityCriteria(objectCriteria.map(criteria => new EntityCriterion(criteria as any)));
    }

    toString(): string {
        const shards: string[] = [];

        for (const key in this.bag) {
            const criteria = this.bag[key];

            // [todo] this check only exists because i wanted typed ObjectCriterion to not require specifying a critera on each keyof T
            // seems kinda unclean, so revisit on how to do it better
            if (criteria === void 0) continue;

            if (criteria instanceof ValueCriteria) {
                shards.push(`${key}:${criteria.toString()}`);
            } else if (isValuesCriteria(criteria)) {
                shards.push(`${key}:NOT_IMPLEMENTED`);
            } else {
                shards.push(`${key}:${criteria.toString()}`);
            }
        }

        return `{ ${shards.join(" & ")} }`;
    }
}

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

export class EntityCriterion<T = unknown> extends Criterion {
    constructor(items: Partial<Record<keyof T, Criterion>>) {
        super();
        this.bag = items;
    }

    readonly bag: Partial<Record<keyof T, Criterion>>;

    getBag(): Partial<Record<keyof T, Criterion>> {
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

    // [todo] remove "as any" hacks
    reduce(other: Criterion): boolean | Criterion {
        if (other instanceof Criteria) {
            return other.reduceBy(this);
        } else if (other instanceof EntityCriterion) {
            const reducedPropertyCriteriaBag = new Map<string, Criterion>();

            for (const key in this.bag) {
                const myCriterion = this.bag[key];

                if (myCriterion === void 0) {
                    continue;
                }

                const otherCriterion = other.bag[key];
                let reduced: Criterion | boolean = false;

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

            const objectCriterion: Record<string, Criterion> = {};

            // [todo] i think there is an Object.fromEntries() method that we could use, but we need to upgrade our ES target @ tsconfigs
            for (const [key, reducedPropertyCriteria] of Object.entries(other.bag)) {
                objectCriterion[key] = reducedPropertyCriteria as any;
            }

            const objectCriteria: Record<string, Criterion>[] = [];

            for (const [key, reducedPropertyCriteria] of reducedPropertyCriteriaBag) {
                objectCriteria.push({ ...objectCriterion, [key]: reducedPropertyCriteria });
                objectCriterion[key] = (this.bag as any)[key];
            }

            const entityCriterionPieces = objectCriteria.map(criteria => new EntityCriterion(criteria));

            if (entityCriterionPieces.length === 1) {
                return entityCriterionPieces[0];
            }

            return new OrCriteria(entityCriterionPieces);
        }

        return false;
    }

    invert(): Criterion {
        throw new Error("not implemented yet");
    }

    toString(): string {
        const shards: string[] = [];

        for (const key in this.bag) {
            const criteria = this.bag[key];
            if (criteria === void 0) continue;

            shards.push(`${key}: ${criteria.toString()}`);
        }

        return `{ ${shards.join(" & ")} }`;
    }
}

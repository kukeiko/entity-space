import { isValuesCriteria } from "../../values-criterion";
import { ObjectCriteria } from "./object-criteria";
import { ValueCriteria } from "./value-criteria";

type PropertyCriteria = ValueCriteria<unknown> | ObjectCriteria;

export class ObjectCriterion {
    // constructor(valueType: () => T, items: Record<string, PropertyCriteria<T>>) {
    constructor(items: Record<string, PropertyCriteria>) {
        // this.valueType = valueType;
        this.items = items;
    }

    // readonly valueType: () => T;
    readonly items: Record<string, PropertyCriteria>;

    // isOtherCompatibleWithMe(other: ObjectCriterion<unknown>): other is ObjectCriterion<T> {
    //     return other.valueType === this.valueType;
    // }

    reduce(other: ObjectCriterion): ObjectCriteria | false {
        // if (!this.isOtherCompatibleWithMe(other)) {
        //     return false;
        // }

        // type PropertyCriteria = ValueCriteria | ValuesCriteria | ObjectCriteria;
        // type PropertyCriteria = ValueCriteria<T> | ObjectCriterion<T>[];

        const reducedPropertyCriteriaBag = new Map<string, PropertyCriteria>();

        for (const key in this.items) {
            const criteriaA = other.items[key];
            const criteriaB = this.items[key];
            let reduced: PropertyCriteria | false = false;

            /**
             * [todo] need "invertCriterion()" for this case
             */
            if (criteriaA === void 0) {
                if (criteriaB instanceof ValueCriteria) {
                    reduced = criteriaB.invert();

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
            } else if (criteriaB instanceof ValueCriteria) {
                if (criteriaA instanceof ValueCriteria) {
                    reduced = criteriaB.reduce(criteriaA);
                } else {
                    throw new Error("trying to reduce two criteria of different types");
                }
            } else if (isValuesCriteria(criteriaB)) {
                throw new Error("ValuesCriteria reduction not yet implemented");
            } else if (criteriaB !== void 0) {
                if (criteriaA instanceof ValueCriteria) {
                    throw new Error("trying to reduce two criteria of different types");
                } else if (isValuesCriteria(criteriaA)) {
                    throw new Error("trying to reduce two criteria of different types");
                } else {
                    reduced = criteriaB.reduce(criteriaA);
                }
            }

            if (!reduced) {
                /**
                 * failed to reduce a property of [A] => no intersection => return [A] as is
                 */
                return false;
            } else if (reduced.items.length > 0) {
                reducedPropertyCriteriaBag.set(key, reduced);
            }
        }

        if (reducedPropertyCriteriaBag.size == 0) {
            return new ObjectCriteria([]);
        }

        const objectCriterion: Record<string, PropertyCriteria> = {};

        // [todo] i think there is an Object.fromEntries() method that we could use, but we need to upgrade our ES target @ tsconfigs
        for (const [key, reducedPropertyCriteria] of Object.entries(other.items)) {
            objectCriterion[key] = reducedPropertyCriteria;
        }

        const objectCriteria: Record<string, PropertyCriteria>[] = [];

        for (const [key, reducedPropertyCriteria] of reducedPropertyCriteriaBag) {
            objectCriteria.push({ ...objectCriterion, [key]: reducedPropertyCriteria });
            objectCriterion[key] = this.items[key];
        }

        return new ObjectCriteria(objectCriteria.map(criteria => new ObjectCriterion(criteria)));
    }

    toString(): string {
        const shards: string[] = [];

        for (const key in this.items) {
            const criteria = this.items[key];

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

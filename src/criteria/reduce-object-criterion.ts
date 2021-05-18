import { ObjectCriterion } from "./object-criterion";
import { isValueCriteria, reduceValueCriteria } from "./value-criterion";
import { PropertyCriteria } from "./property-criteria";
import { ObjectCriteria } from "./object-criteria";
import { invertValueCriteria } from "./value-criterion/invert-value-criteria";

export function reduceObjectCriterion(a: ObjectCriterion, b: ObjectCriterion): ObjectCriteria | false {
    const reducedPropertyCriteriaBag = new Map<string, PropertyCriteria>();

    for (const key in b) {
        const criteriaA = a[key];
        const criteriaB = b[key];
        let reduced: PropertyCriteria | false;

        /**
         * [todo] need "invertCriterion()" for this case
         */
        if (criteriaA === void 0) {
            if (isValueCriteria(criteriaB)) {
                reduced = invertValueCriteria(criteriaB);

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
        } else if (isValueCriteria(criteriaB)) {
            if (isValueCriteria(criteriaA)) {
                reduced = reduceValueCriteria(criteriaA, criteriaB);
            } else {
                throw new Error("trying to reduce two criteria of different types");
            }
        } else {
            throw new Error("currently only ValueCriteria are supported @ ObjectCriterion.reduce()");
        }

        if (!reduced) {
            /**
             * failed to reduce a property of [A] => no intersection => return [A] as is
             */
            return false;
        } else if (reduced.length > 0) {
            reducedPropertyCriteriaBag.set(key, reduced);
        }
    }

    if (reducedPropertyCriteriaBag.size == 0) {
        return [];
    }

    const objectCriterion: ObjectCriterion = {};

    // [todo] i think there is an Object.fromEntries() method that we could use, but we need to upgrade our ES target @ tsconfigs
    for (const [key, reducedPropertyCriteria] of Object.entries(a)) {
        objectCriterion[key] = reducedPropertyCriteria;
    }

    const objectCriteria: ObjectCriteria = [];

    for (const [key, reducedPropertyCriteria] of reducedPropertyCriteriaBag) {
        objectCriteria.push({ ...objectCriterion, [key]: reducedPropertyCriteria });
        objectCriterion[key] = b[key];
    }

    return objectCriteria;
}

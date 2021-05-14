import { ObjectCriterion } from "./object-criterion";
import { isValueCriteria, reduceValueCriteria } from "./value-criterion";
import { PropertyCriteria } from "./property-criteria";
import { ObjectCriteria } from "./object-criteria";

export function reduceObjectCriterion(a: ObjectCriterion, b: ObjectCriterion): ObjectCriteria {
    let reducedPropertyCriteria: { key: string; reduced: PropertyCriteria } | undefined;

    for (const key in b) {
        const criteriaA = a[key];

        /**
         * [B] has a criteria that [A] doesn't, it therefore can't be a superset
         * => return [A] as is
         */
        if (criteriaA === void 0) {
            return [a];
        }

        const criteriaB = b[key];
        let reduced: PropertyCriteria | null;

        if (isValueCriteria(criteriaB)) {
            if (isValueCriteria(criteriaA)) {
                reduced = reduceValueCriteria(criteriaA, criteriaB);
            } else {
                throw new Error("trying to reduce two criteria of different types");
            }
        } else {
            throw new Error("currently only ValueCriteria are supported @ ObjectCriterion.reduce()");
        }

        if (reduced === criteriaA) {
            /**
             * failed to reduce a property of [A] => return [A] as is.
             */
            return [a];
        } else if (reduced !== null && reducedPropertyCriteria !== void 0) {
            /**
             * reduced a property of [A] but we already reduced another, therefore [B] is no longer a superset of [A]
             * => return [B] as is
             */
            return [a];
        } else if (reduced !== null && reducedPropertyCriteria === void 0) {
            /**
             * the first property of [A] that we could reduce => store and continue.
             * from this point on we're expecting full reductions in order to to continue,
             * otherwise [A] is returned as is.
             */
            reducedPropertyCriteria = { key, reduced };
        }
    }

    if (reducedPropertyCriteria === void 0) {
        return [];
    } else {
        return [
            {
                ...a,
                [reducedPropertyCriteria.key]: reducedPropertyCriteria.reduced,
            },
        ];
    }
}

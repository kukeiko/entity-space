import { Criterion } from "./criterion";
import { isValueCriteria, reduceValueCriteria } from "./value-criterion";
import { PropertyCriteria } from "./property-criteria";

export function reduceCriterion(a: Criterion, b: Criterion): Criterion | null {
    let reducedPropertyCriteria: { key: string; reduced: PropertyCriteria } | undefined;

    for (const key in b) {
        const criteriaA = a[key];

        /**
         * [B] has a criteria that [A] doesn't, it therefore can't be a superset
         * => return [A] as is
         */
        if (criteriaA === void 0) {
            return a;
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
             * failed to reduce a property of [B] => return [B] as is.
             */
            return a;
        } else if (reduced !== null && reducedPropertyCriteria !== void 0) {
            /**
             * reduced a property of [B] but we already reduced another, therefore [A] is no longer a superset of [B]
             * => return [B] as is
             */
            return a;
        } else if (reduced !== null && reducedPropertyCriteria === void 0) {
            /**
             * the first property of [B] that we could reduce => store and continue.
             * from this point on we're expecting full reductions in order to to continue,
             * otherwise [B] is returned as is.
             */
            reducedPropertyCriteria = { key, reduced };
        }
    }

    if (reducedPropertyCriteria === void 0) {
        return null;
    } else {
        return {
            ...a,
            [reducedPropertyCriteria.key]: reducedPropertyCriteria.reduced,
        };
    }
}

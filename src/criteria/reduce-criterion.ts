import { Criterion } from "./criterion";
import { ValueCriteria } from "./value-criterion";
import { PropertyCriteria } from "./property-criteria";

export function reduceCriterion(a: Criterion, b: Criterion): Criterion | null {
    let reducedPropertyCriteria: { key: string; reduced: PropertyCriteria } | undefined;

    for (const key in a) {
        const criteriaB = b[key];

        /**
         * [A] has a criteria that [B] doesn't, it therefore can't be a superset
         * => return [B] as is
         */
        if (criteriaB === void 0) {
            return b;
        }

        const criteriaA = a[key];
        let reduced: PropertyCriteria | null;

        if (ValueCriteria.is(criteriaA)) {
            if (ValueCriteria.is(criteriaB)) {
                reduced = ValueCriteria.reduce(criteriaA, criteriaB);
            } else {
                throw new Error("trying to reduce two criteria of different types");
            }
        } else {
            throw new Error("currently only ValueCriteria are supported @ ObjectCriterion.reduce()");
        }

        if (reduced === criteriaB) {
            /**
             * failed to reduce a property of [B] => return [B] as is.
             */
            return b;
        } else if (reduced !== null && reducedPropertyCriteria !== void 0) {
            /**
             * reduced a property of [B] but we already reduced another, therefore [A] is no longer a superset of [B]
             * => return [B] as is
             */
            return b;
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
            ...b,
            [reducedPropertyCriteria.key]: reducedPropertyCriteria.reduced,
        };
    }
}

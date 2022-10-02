import { isPrimitiveOrNull, isPrimitiveOrNullNoCustomArg, Null, Primitive } from "@entity-space/utils";
import { AnyCriterion } from "../any/any";
import { any } from "../any/any.fn";
import { Criterion } from "../criterion";
import { inSet } from "../set/in-set.fn";
import { isValue } from "../value/is-value.fn";
import { NamedCriteria } from "./named-criteria";

// [todo] "find references" doesn't work to find model properties
export type MatchesBagArgument<T> = Partial<
    Record<keyof T, Criterion | ReturnType<Primitive | typeof Null> | ReturnType<Primitive | typeof Null>[]>
>;

/**
 * [todo] name is a bit unintuitive. it doesn't really reflect that we're creating named-criteria here.
 * however, named-criteria are an integral part for filtering entities, so it does have a reason to use
 * a very generic word. if we keep it, we just expect it to be part of the learning curve.
 */
export function matches<T>(bag: MatchesBagArgument<T>): Criterion {
    const criterionBag: Record<string, Criterion> = {};

    for (const key in bag) {
        const value = bag[key];
        if (isPrimitiveOrNull(value)) {
            criterionBag[key] = isValue(value);
        } else if (Array.isArray(value) && value.every(isPrimitiveOrNullNoCustomArg)) {
            if (value.length === 0) {
                criterionBag[key] = any();
            } else {
                criterionBag[key] = inSet(value);
            }
        } else if (value instanceof Criterion) {
            criterionBag[key] = value;
        } else {
            throw new Error(`invalid property "${key}" in named criteria bag`);
        }
    }

    if (Object.keys(criterionBag).length === 0) {
        return any();
    } else if (Object.values(criterionBag).every(value => value instanceof AnyCriterion)) {
        return any();
    }

    return new NamedCriteria(criterionBag);
}

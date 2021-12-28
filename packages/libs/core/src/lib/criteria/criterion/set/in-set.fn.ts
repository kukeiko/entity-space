import { InNumberSetCriterion } from "./in-number-set-criterion";
import { InStringSetCriterion } from "./in-string-set-criterion";

function firstValueIsString(set: Iterable<unknown>): set is Iterable<string> {
    return typeof set[Symbol.iterator]().next().value === "string";
}

function firstValueIsNumber(set: Iterable<unknown>): set is Iterable<number> {
    return typeof set[Symbol.iterator]().next().value === "number";
}

export function inSet(values: Iterable<number>): InNumberSetCriterion;
export function inSet(values: Iterable<string>): InStringSetCriterion;
export function inSet<T>(values: Iterable<T>): InNumberSetCriterion | InStringSetCriterion {
    if (firstValueIsString(values)) {
        return new InStringSetCriterion(values);
    } else if (firstValueIsNumber(values)) {
        return new InNumberSetCriterion(values);
    } else {
        throw new Error(`values empty or contain unsupported type`);
    }
}

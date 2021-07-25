import { NotInNumberSetCriterion } from "./not-in-number-set-criterion";
import { NotInStringSetCriterion } from "./not-in-string-set-criterion";

function firstValueIsString(set: Iterable<unknown>): set is Iterable<string> {
    return typeof set[Symbol.iterator]().next().value === "string";
}

function firstValueIsNumber(set: Iterable<unknown>): set is Iterable<number> {
    return typeof set[Symbol.iterator]().next().value === "number";
}

export function notInSet(values: Iterable<number>): NotInNumberSetCriterion;
export function notInSet(values: Iterable<string>): NotInStringSetCriterion;
export function notInSet<T>(values: Iterable<T>): NotInNumberSetCriterion | NotInStringSetCriterion {
    if (firstValueIsString(values)) {
        return new NotInStringSetCriterion(values);
    } else if (firstValueIsNumber(values)) {
        return new NotInNumberSetCriterion(values);
    } else {
        throw new Error(`values empty or contain unsupported type`);
    }
}

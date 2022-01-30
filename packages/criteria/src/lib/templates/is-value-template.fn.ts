import { Null, Primitive } from "@entity-space/utils";
import { IsValueCriterionTemplate } from "./is-value-criterion.template";

export function isValueTemplate<T extends Primitive | typeof Null, U extends T[]>(
    ...valueTypes: [...U]
): IsValueCriterionTemplate<[...U][number]>;
export function isValueTemplate<T extends Primitive | typeof Null>(valueTypes: T[]): IsValueCriterionTemplate<T>;
export function isValueTemplate<T extends Primitive | typeof Null>(...args: any): IsValueCriterionTemplate<T> {
    if (Array.isArray(args[0])) {
        return new IsValueCriterionTemplate(args[0]);
    } else {
        return new IsValueCriterionTemplate(args);
    }
}

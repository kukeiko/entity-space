import { Null, Primitive } from "@entity-space/utils";
import { InSetCriterionTemplate } from "./in-set-criterion-template";

export function inSetTemplate<T extends Primitive | typeof Null, U extends T[]>(
    ...valueTypes: [...U]
): InSetCriterionTemplate<[...U][number]>;
export function inSetTemplate<T extends Primitive | typeof Null>(valueTypes: T[]): InSetCriterionTemplate<T>;
export function inSetTemplate<T extends Primitive | typeof Null>(...args: any): InSetCriterionTemplate<T> {
    if (Array.isArray(args[0])) {
        return new InSetCriterionTemplate(args[0]);
    } else {
        return new InSetCriterionTemplate(args);
    }
}

import { Null, Primitive } from "@entity-space/utils";
import { InSetCriterionShape } from "./in-set-criterion-shape";

export function inSetShape<T extends Primitive | typeof Null, U extends T[]>(
    ...valueTypes: [...U]
): InSetCriterionShape<[...U][number]>;
export function inSetShape<T extends Primitive | typeof Null>(valueTypes: T[]): InSetCriterionShape<T>;
export function inSetShape<T extends Primitive | typeof Null>(...args: any): InSetCriterionShape<T> {
    if (Array.isArray(args[0])) {
        return new InSetCriterionShape(args[0]);
    } else {
        return new InSetCriterionShape(args);
    }
}

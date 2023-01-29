import { Null, Primitive } from "@entity-space/utils";
import { IsValueCriterionShape } from "./is-value-criterion-shape";

export function isValueShape<T extends Primitive | typeof Null, U extends T[]>(
    ...valueTypes: [...U]
): IsValueCriterionShape<[...U][number]>;
export function isValueShape<T extends Primitive | typeof Null>(valueTypes: T[]): IsValueCriterionShape<T>;
export function isValueShape<T extends Primitive | typeof Null>(...args: any): IsValueCriterionShape<T> {
    if (Array.isArray(args[0])) {
        return new IsValueCriterionShape(args[0]);
    } else if (Array.isArray(args) && args.length > 0) {
        return new IsValueCriterionShape(args);
    } else {
        return new IsValueCriterionShape();
    }
}

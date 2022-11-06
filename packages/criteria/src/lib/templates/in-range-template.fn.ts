import { InRangeCriterionShape } from "./in-range-criterion-template";

export function inRangeShape<T extends typeof Number | typeof String>(valueType: T): InRangeCriterionShape<T> {
    return new InRangeCriterionShape(valueType);
}

import { InRangeCriterionShape } from "./in-range-criterion-shape";

export function inRangeShape<T extends typeof Number | typeof String>(valueType: T): InRangeCriterionShape<T> {
    return new InRangeCriterionShape(valueType);
}

import { InRangeCriterionTemplate } from "./in-range-criterion-template";

export function inRangeTemplate<T extends typeof Number | typeof String>(valueType: T): InRangeCriterionTemplate<T> {
    return new InRangeCriterionTemplate(valueType);
}

import { PrimitiveIncludingNull } from "@entity-space/utils";
import { IsValueCriterionTemplate } from "./is-value-criterion-template";

export function isValueTemplate<T extends PrimitiveIncludingNull>(valueTypes: T[]): IsValueCriterionTemplate<T> {
    return new IsValueCriterionTemplate(valueTypes);
}

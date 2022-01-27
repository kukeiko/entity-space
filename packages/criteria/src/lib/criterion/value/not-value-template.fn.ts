import { PrimitiveIncludingNull } from "@entity-space/utils";
import { NotValueCriterionTemplate } from "./not-value-criterion-template";

export function notValueTemplate<T extends PrimitiveIncludingNull>(valueTypes: T[]): NotValueCriterionTemplate<T> {
    return new NotValueCriterionTemplate(valueTypes);
}

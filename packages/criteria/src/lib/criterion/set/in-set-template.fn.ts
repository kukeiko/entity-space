import { PrimitiveIncludingNull } from "@entity-space/utils";
import { InSetCriterionTemplate } from "./in-set-criterion-template";

export function inSetTemplate<T extends PrimitiveIncludingNull>(valueTypes: T[]): InSetCriterionTemplate<T> {
    return new InSetCriterionTemplate(valueTypes);
}

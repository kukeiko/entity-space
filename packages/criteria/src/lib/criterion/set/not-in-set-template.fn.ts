import { PrimitiveIncludingNull } from "@entity-space/utils";
import { NotInSetCriterionTemplate } from "./not-in-set-criterion-template";

export function notInSetTemplate<T extends PrimitiveIncludingNull>(valueTypes: T[]): NotInSetCriterionTemplate<T> {
    return new NotInSetCriterionTemplate(valueTypes);
}

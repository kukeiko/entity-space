import { PrimitiveIncludingNull } from "@entity-space/utils";
import { Criterion } from "../criterion";
import { NotInSetCriterion } from "./not-in-set-criterion";

// [todo] handle empty values
export function notInSet(values: Iterable<ReturnType<PrimitiveIncludingNull>>): Criterion {
    return new NotInSetCriterion(values);
}

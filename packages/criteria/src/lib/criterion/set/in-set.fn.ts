import { PrimitiveIncludingNull } from "@entity-space/utils";
import { Criterion } from "../criterion";
import { InSetCriterion } from "./in-set-criterion";

// [todo] handle empty values
export function inSet(values: Iterable<ReturnType<PrimitiveIncludingNull>>): Criterion {
    return new InSetCriterion(values);
}

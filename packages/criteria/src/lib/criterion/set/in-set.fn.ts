import { PrimitiveIncludingNull } from "@entity-space/utils";
import { any } from "../any/any.fn";
import { Criterion } from "../criterion";
import { InSetCriterion } from "./in-set-criterion";

export function inSet(values: Iterable<ReturnType<PrimitiveIncludingNull>>): Criterion {
    if (Array.from(values).length == 0) {
        return any();
    }

    return new InSetCriterion(values);
}

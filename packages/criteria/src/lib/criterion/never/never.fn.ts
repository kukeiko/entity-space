import { Criterion } from "../criterion";
import { NeverCriterion } from "./never";

export function never(): Criterion {
    return new NeverCriterion();
}

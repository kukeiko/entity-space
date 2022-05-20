import { Criterion } from "../criterion";
import { AnyCriterion } from "./any";

export function any(): Criterion {
    return new AnyCriterion();
}

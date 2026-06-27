import { Criterion } from "../criterion";
import { SomeCriterion } from "../some-criterion";
import { subtractCriterion } from "./subtract-criterion.fn";

export function subtractBySomeCriterion(someCriterion: SomeCriterion, what: Criterion): boolean | Criterion {
    if (!(what instanceof SomeCriterion)) {
        return false;
    }

    const result = subtractCriterion(what.getCriterion(), someCriterion.getCriterion());

    if (typeof result === "boolean") {
        return result;
    }

    return new SomeCriterion(result);
}

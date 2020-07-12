import { ValueCriterion } from "../../../src";
import { expectValueCriterionReduction } from "./utils";

export function runValueCriterionCases_NotEquals(): void {
    expectValueCriterionReduction(
        "'x != 1' should completely reduce itself",
        ValueCriterion.NotEquals.create(1),
        ValueCriterion.NotEquals.create(1),
        null
    );

    expectValueCriterionReduction(
        "'x != 1' should completely reduce 'x == 2'",
        ValueCriterion.NotEquals.create(1),
        ValueCriterion.Equals.create(2),
        null
    );
}

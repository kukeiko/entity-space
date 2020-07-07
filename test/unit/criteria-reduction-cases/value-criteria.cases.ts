import { ValueCriterion } from "../../../src";
import { expectValueCriteriaReduction } from "./utils";

export function runValueCriteriaCases(): void {
    expectValueCriteriaReduction(
        "[x == 1, x == 2] should completely reduce itself",
        [ValueCriterion.Equals.create(1), ValueCriterion.Equals.create(2)],
        [ValueCriterion.Equals.create(1), ValueCriterion.Equals.create(2)],
        null
    );

    expectValueCriteriaReduction(
        "[x == 1, x == 2] should reduce [x in (2, 3)] to [x == 3]",
        [ValueCriterion.Equals.create(1), ValueCriterion.Equals.create(2)],
        [ValueCriterion.In.create([2, 3])],
        [ValueCriterion.Equals.create(3)]
    );

    expectValueCriteriaReduction(
        "[x == 1, x == 2, x == 3] should completely reduce [x in (2, 3)]",
        [ValueCriterion.Equals.create(1), ValueCriterion.Equals.create(2), ValueCriterion.Equals.create(3)],
        [ValueCriterion.In.create([2, 3])],
        null
    );

    expectValueCriteriaReduction(
        "[x == 1, x == 2] should not reduce [x in (3, 4)]",
        [ValueCriterion.Equals.create(1), ValueCriterion.Equals.create(2)],
        [ValueCriterion.In.create([3, 4])],
        "no-change"
    );

    expectValueCriteriaReduction(
        "[x in (1, 2), x in (0, 4)] should reduce [x == 2, x in (1, 3, 5), x == 4] to [x in (3, 5)]",
        [ValueCriterion.In.create([1, 2]), ValueCriterion.In.create([0, 4])],
        [ValueCriterion.Equals.create(2), ValueCriterion.In.create([1, 3, 5]), ValueCriterion.Equals.create(4)],
        [ValueCriterion.In.create([3, 5])]
    );
}

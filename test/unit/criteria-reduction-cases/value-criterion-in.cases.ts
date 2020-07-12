import { ValueCriterion } from "../../../src";
import { expectValueCriterionReduction } from "./utils";

export function runValueCriterionCases_In(): void {
    expectValueCriterionReduction(
        "'x in [1, 2]' should completely reduce itself",
        ValueCriterion.In.create([1, 2]),
        ValueCriterion.In.create([1, 2]),
        null
    );
    /**
     * [equals]
     */
    expectValueCriterionReduction(
        "'x in [1, 2]' should completely reduce 'x == 1'",
        ValueCriterion.In.create([1, 2]),
        ValueCriterion.Equals.create(1),
        null
    );

    expectValueCriterionReduction(
        "'x in [1, 2]' should not reduce 'x == 0'",
        ValueCriterion.In.create([1, 2]),
        ValueCriterion.Equals.create(0),
        "no-change"
    );

    /**
     * [not-equals]
     */
    expectValueCriterionReduction(
        "'x in [1, 2]' should reduce 'x != 3' to 'x not in [1, 2, 3]'",
        ValueCriterion.In.create([1, 2]),
        ValueCriterion.NotEquals.create(3),
        ValueCriterion.NotIn.create([1, 2, 3])
    );

    expectValueCriterionReduction(
        "'x in [1, 2]' should reduce 'x != 2' to 'x not in [1, 2]'",
        ValueCriterion.In.create([1, 2]),
        ValueCriterion.NotEquals.create(2),
        ValueCriterion.NotIn.create([1, 2])
    );

    expectValueCriterionReduction(
        "'x in [1]' should not reduce 'x != 1'",
        ValueCriterion.In.create([1]),
        ValueCriterion.NotEquals.create(1),
        "no-change"
    );

    /**
     * [less-equals]
     */
    expectValueCriterionReduction(
        "'x in [1, 2]' should reduce 'x <= 2' to 'x < 2'",
        ValueCriterion.In.create([1, 2]),
        ValueCriterion.LessEquals.create(2),
        ValueCriterion.Less.create(2)
    );

    expectValueCriterionReduction(
        "'x in [1, 2]' should not reduce 'x <= 3",
        ValueCriterion.In.create([1, 2]),
        ValueCriterion.LessEquals.create(3),
        "no-change"
    );

    /**
     * [greater-equals]
     */
    expectValueCriterionReduction(
        "'x in [1, 2]' should reduce 'x >= 2' to 'x > 2'",
        ValueCriterion.In.create([1, 2]),
        ValueCriterion.GreaterEquals.create(2),
        ValueCriterion.Greater.create(2)
    );

    expectValueCriterionReduction(
        "'x in [1, 2]' should not reduce 'x >= 0",
        ValueCriterion.In.create([1, 2]),
        ValueCriterion.GreaterEquals.create(0),
        "no-change"
    );

    /**
     * [in]
     */
    expectValueCriterionReduction(
        "'x in [1, 2]' should reduce 'x in [1, 2, 3, 4]' to 'x in [3, 4]'",
        ValueCriterion.In.create([1, 2]),
        ValueCriterion.In.create([1, 2, 3, 4]),
        ValueCriterion.In.create([3, 4])
    );

    expectValueCriterionReduction(
        "'x in [1, 2]' should reduce 'x in [2, 3, 4]' to 'x in [3, 4]'",
        ValueCriterion.In.create([1, 2]),
        ValueCriterion.In.create([2, 3, 4]),
        ValueCriterion.In.create([3, 4]),
    );

    expectValueCriterionReduction(
        "'x in [1, 2]' should reduce 'x in [1, 2, 3]' to 'x == 3'",
        ValueCriterion.In.create([1, 2]),
        ValueCriterion.In.create([1, 2, 3]),
        ValueCriterion.Equals.create(3)
    );

    /**
     * [not-in]
     */
    expectValueCriterionReduction(
        "'x in [1, 2]' should reduce 'x not in [3, 4]' to 'x not in [1, 2, 3, 4]'",
        ValueCriterion.In.create([1, 2]),
        ValueCriterion.NotIn.create([3, 4]),
        ValueCriterion.NotIn.create([1, 2, 3, 4])
    );

    expectValueCriterionReduction(
        "'x in [1, 2]' should not reduce 'x not in [1, 2]'",
        ValueCriterion.In.create([1, 2]),
        ValueCriterion.NotIn.create([1, 2]),
        "no-change"
    );

    /**
     * [from-to]
     */
    expectValueCriterionReduction(
        "'x in [1, 2]' should reduce 'x >= 1 && x <= 2' to 'x > 1 && x < 2'",
        ValueCriterion.In.create([1, 2]),
        ValueCriterion.FromTo.create([1, 2]),
        ValueCriterion.FromTo.create([1, 2], false)
    );

    expectValueCriterionReduction(
        "'x in [1, 2]' should not reduce 'x >= 3 && x <= 4'",
        ValueCriterion.In.create([1, 2]),
        ValueCriterion.FromTo.create([3, 4]),
        "no-change"
    );
}

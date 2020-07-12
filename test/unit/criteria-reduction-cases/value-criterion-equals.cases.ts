import { ValueCriterion } from "../../../src";
import { expectValueCriterionReduction } from "./utils";

export function runValueCriterionCases_Equals() : void {
    expectValueCriterionReduction(
        "'x == 1' should completely reduce itself",
        ValueCriterion.Equals.create(1),
        ValueCriterion.Equals.create(1),
        null
    );

    expectValueCriterionReduction(
        "'x == 1' should not reduce 'x == 2'",
        ValueCriterion.Equals.create(1),
        ValueCriterion.Equals.create(2),
        "no-change"
    );

    /**
     * [not equals]
     */
    expectValueCriterionReduction(
        "'x == 1' should reduce 'x != 2' to 'x not in [1, 2]'",
        ValueCriterion.Equals.create(1),
        ValueCriterion.NotEquals.create(2),
        ValueCriterion.NotIn.create([1, 2])
    );

    expectValueCriterionReduction(
        "'x == 1' should not reduce 'x != 1'",
        ValueCriterion.Equals.create(1),
        ValueCriterion.NotEquals.create(1),
        "no-change"
    );

    /**
     * [less equals]
     */
    expectValueCriterionReduction(
        "'x == 1' should reduce 'x <= 1' to 'x < 1'",
        ValueCriterion.Equals.create(1),
        ValueCriterion.LessEquals.create(1),
        ValueCriterion.Less.create(1)
    );

    expectValueCriterionReduction(
        "'x == 1' should not reduce 'x <= 2'",
        ValueCriterion.Equals.create(1),
        ValueCriterion.LessEquals.create(2),
        "no-change"
    );

    expectValueCriterionReduction(
        "'x == 1' should not reduce 'x <= 0'",
        ValueCriterion.Equals.create(1),
        ValueCriterion.LessEquals.create(0),
        "no-change"
    );

    /**
     * [greater equals]
     */
    expectValueCriterionReduction(
        "'x == 1' should reduce 'x >= 1' to 'x > 1'",
        ValueCriterion.Equals.create(1),
        ValueCriterion.GreaterEquals.create(1),
        ValueCriterion.Greater.create(1)
    );

    expectValueCriterionReduction(
        "'x == 1' should not reduce 'x >= 0'",
        ValueCriterion.Equals.create(1),
        ValueCriterion.GreaterEquals.create(0),
        "no-change"
    );

    expectValueCriterionReduction(
        "'x == 1' should not reduce 'x >= 2'",
        ValueCriterion.Equals.create(1),
        ValueCriterion.GreaterEquals.create(2),
        "no-change"
    );

    /**
     * [in]
     */
    expectValueCriterionReduction(
        "'x == 1' should reduce 'x in [1, 2, 3]' to 'x in [2, 3]'",
        ValueCriterion.Equals.create(1),
        ValueCriterion.In.create([1, 2, 3]),
        ValueCriterion.In.create([2, 3])
    );

    expectValueCriterionReduction(
        "'x == 1' should reduce 'x in [1, 2]' to 'x == 2'",
        ValueCriterion.Equals.create(1),
        ValueCriterion.In.create([1, 2]),
        ValueCriterion.Equals.create(2)
    );

    expectValueCriterionReduction(
        "'x == 1' should not reduce 'x in [2, 3]'",
        ValueCriterion.Equals.create(1),
        ValueCriterion.In.create([2, 3]),
        "no-change"
    );

    /**
     * [not-in]
     */
    expectValueCriterionReduction(
        "'x == 1' should reduce 'x not in [2, 3]' to 'x not in [1, 2, 3]'",
        ValueCriterion.Equals.create(1),
        ValueCriterion.NotIn.create([2, 3]),
        ValueCriterion.NotIn.create([1, 2, 3])
    );

    expectValueCriterionReduction(
        "'x == 1' should not reduce 'x not in [1, 2]'",
        ValueCriterion.Equals.create(1),
        ValueCriterion.NotIn.create([1, 2]),
        "no-change"
    );

    /**
     * [from-to]
     */
    expectValueCriterionReduction(
        "'x == 1' should reduce '>= 1 && <= 2' to '> 1 && <= 2'",
        ValueCriterion.Equals.create(1),
        ValueCriterion.FromTo.create([1, 2]),
        ValueCriterion.FromTo.create([1, 2], [false])
    );

    expectValueCriterionReduction(
        "'x == 1' should completely reduce '>= 1 && <= 1'",
        ValueCriterion.Equals.create(1),
        ValueCriterion.FromTo.create([1, 1]),
        null
    );

    expectValueCriterionReduction(
        "'x == 1' should reduce '>= 0 && <= 1' to '>= 0 && < 1'",
        ValueCriterion.Equals.create(1),
        ValueCriterion.FromTo.create([0, 1]),
        ValueCriterion.FromTo.create([0, 1], [true, false])
    );

    expectValueCriterionReduction(
        "'x == 1' should not reduce '>= 2 && <= 3'",
        ValueCriterion.Equals.create(1),
        ValueCriterion.FromTo.create([2, 3]),
        "no-change"
    );
}

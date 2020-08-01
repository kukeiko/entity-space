import { createInValueCriterion } from "src";
import { expectCriterionReduction } from "./utils";

export function runCriterionCases(): void {
    expectCriterionReduction(
        "{ foo in [2], bar in [3, 4, 7] } reduced by equivalent should be null",
        {
            foo: [createInValueCriterion([2])],
            bar: [createInValueCriterion([3, 4, 7])],
        },
        {
            foo: [createInValueCriterion([2])],
            bar: [createInValueCriterion([3, 4, 7])],
        },
        null
    );

    expectCriterionReduction(
        "{ foo in [2], bar in [3] } reduced by { foo in [2] } should be null",
        {
            foo: [createInValueCriterion([2])],
            bar: [createInValueCriterion([3])],
        },
        {
            foo: [createInValueCriterion([2])],
        },
        null
    );

    expectCriterionReduction(
        "{ foo in [3] } reduced by { foo in [2] } should be { foo in [3] }",
        {
            foo: [createInValueCriterion([3])],
        },
        {
            foo: [createInValueCriterion([2])],
        },
        "no-change"
    );

    /**
     * [A] is a subset of [B]
     */
    expectCriterionReduction(
        "{ foo in [2] } reduced by { foo in [2], bar in [3] } should be { foo in [2] }",
        {
            foo: [createInValueCriterion([2])],
        },
        {
            foo: [createInValueCriterion([2])],
            bar: [createInValueCriterion([3])],
        },
        "no-change"
    );

    /**
     * 'a' shares criteria with but still doesn't intersect 'b'
     */
    expectCriterionReduction(
        "{ foo in [2], bar in [3] } reduced by { foo in [2], bar in [4] } should be { foo in [2], bar in [3] }",
        {
            foo: [createInValueCriterion([2])],
            bar: [createInValueCriterion([3])],
        },
        {
            foo: [createInValueCriterion([2])],
            bar: [createInValueCriterion([4])],
        },
        "no-change"
    );

    /**
     * 'a' has its intersection w/ 'b' removed
     */
    {
        expectCriterionReduction(
            "{ foo in [1, 2], bar in [3] } reduced by { foo in [2] } should be { foo in [1], bar in [3] }",
            {
                foo: [createInValueCriterion([1, 2])],
                bar: [createInValueCriterion([3])],
            },
            {
                foo: [createInValueCriterion([2])],
            },
            {
                foo: [createInValueCriterion([1])],
                bar: [createInValueCriterion([3])],
            }
        );

        expectCriterionReduction(
            "{ foo in [1, 2], bar in [3] } reduced by { foo in [2], bar in [3, 4] } should be { foo in [1], bar in [3] }",
            {
                foo: [createInValueCriterion([1, 2])],
                bar: [createInValueCriterion([3])],
            },
            {
                foo: [createInValueCriterion([2])],
                bar: [createInValueCriterion([3, 4])],
            },
            {
                foo: [createInValueCriterion([1])],
                bar: [createInValueCriterion([3])],
            }
        );
    }
}

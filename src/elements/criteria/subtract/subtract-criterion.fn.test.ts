import { describe, expect, it, test } from "vitest";
import { expectCriterion } from "../../testing/expect-criterion.fn";
import { AndCriterion } from "../and-criterion";
import { Criterion } from "../criterion";
import { EntityCriterion } from "../entity-criterion";
import { EqualsCriterion } from "../equals-criterion";
import { InArrayCriterion } from "../in-array-criterion";
import { InRangeCriterion } from "../in-range-criterion";
import { NotEqualsCriterion } from "../not-equals-criterion";
import { NotInArrayCriterion } from "../not-in-array-criterion";
import { OrCriterion } from "../or-criterion";
import { subtractCriterion } from "./subtract-criterion.fn";

describe(subtractCriterion, () => {
    const where = <T extends any>(criteria: Partial<Record<keyof T, Criterion>>) =>
        new EntityCriterion(criteria as any);
    const inRange = <T extends typeof Number | typeof String>(
        values: readonly [ReturnType<T> | undefined, ReturnType<T> | undefined],
        inclusive: boolean | [boolean, boolean] = true,
    ) => new InRangeCriterion(values[0], values[1], inclusive);

    describe(EqualsCriterion, () => {
        expectCriterion("7").minus("7").toEqual(true);
        expectCriterion("7").minus("3").toEqual(false);
        expectCriterion("1").minus("true").toEqual(false);
        expectCriterion("0").minus("false").toEqual(false);

        expectCriterion("1").minus("!2").toEqual(true);

        expectCriterion("true").minus("true").toEqual(true);
        expectCriterion("true").minus("false").toEqual(false);
        expectCriterion("true").minus("1").toEqual(false);

        expectCriterion("false").minus("false").toEqual(true);
        expectCriterion("false").minus("true").toEqual(false);
        expectCriterion("false").minus("0").toEqual(false);
        expectCriterion("false").minus("null").toEqual(false);

        expectCriterion("null").minus("null").toEqual(true);
        expectCriterion("null").minus("false").toEqual(false);
        expectCriterion("null").minus("true").toEqual(false);
    });

    describe(NotEqualsCriterion, () => {
        expectCriterion("!7").minus("!7").toEqual(true);
        expectCriterion("!7").minus("!3").toEqual("3");
    });

    describe(InArrayCriterion, () => {
        expectCriterion("{ 1, 2, 3 }").minus("2").toEqual("{ 1, 3 }");
        expectCriterion("{ 2 }").minus("2").toEqual(true);
        expectCriterion("{ 1, 2, 3 }").minus("{ 1, 2, 3 }").toEqual(true);
        expectCriterion("{ 1, 2, 3 }").minus("{ 1, 2, 3, 4 }").toEqual(true);
        expectCriterion("{ 1, 2, 3 }").minus("!{ 4 }").toEqual(true);
        expectCriterion("{ 1, 2, 3 }").minus("[1, 3]").toEqual(true);
        expectCriterion("{ 1, 2, 3 }").minus("{ 1, 2, 4 }").toEqual("{ 3 }");
        expectCriterion("{ 1, 2, 3 }").minus("!{ 1 }").toEqual("{ 1 }");
        expectCriterion("{ 1, 2, 3 }").minus("{ 4, 5, 6 }").toEqual(false);
        expectCriterion("{ 1, 2, 3 }").minus("!{ 1, 2, 3 }").toEqual(false);
    });

    describe(NotInArrayCriterion, () => {
        expectCriterion("!{ 1, 2 }").minus("!{ 1, 2 }").toEqual(true);
        expectCriterion("!{ 1, 2 }").minus("!{ 1 }").toEqual(true);
        expectCriterion("!{ 1, 2 }").minus("!{ 1, 2, 3 }").toEqual("{ 3 }");
        expectCriterion("!{ 1 }").minus("!{ 2, 3 }").toEqual("{ 2, 3 }");
        expectCriterion("!{ 450 }").minus("{ 450 }").toEqual(false);
        expectCriterion("!{ 1, 2 }").minus("{ 2, 3 }").toEqual("!{ 1, 2, 3 }");
        expectCriterion("!{ 1, 2, 3 }").minus("[4, 7]").toEqual(false);
    });

    describe(InRangeCriterion, () => {
        expectCriterion("[1, 7]").minus("[1, 7]").toEqual(true);
        expectCriterion("[1, 7]").minus("[0, 8]").toEqual(true);
        expectCriterion("[1, 7]").minus("(0, 8)").toEqual(true);
        expectCriterion("[1, 7]").minus("[0, ...]").toEqual(true);
        expectCriterion("[4, ...]").minus("[3, ...]").toEqual(true);
        expectCriterion("[..., 4]").minus("[..., 5]").toEqual(true);
        expectCriterion("[1, 7]").minus("[..., 9]").toEqual(true);

        expectCriterion("[1, 7]").minus("[-3, 5]").toEqual("(5, 7]");
        expectCriterion("[3, ...]").minus("[1, 8]").toEqual("(8, ...]");
        expectCriterion("[3, ...]").minus("[1, 8)").toEqual("[8, ...]");
        expectCriterion("[1, 7]").minus("[..., 3)").toEqual("[3, 7]");

        expectCriterion("[1, 7]").minus("[3, 10]").toEqual("[1, 3)");
        expectCriterion("[1, 7]").minus("(3, 8]").toEqual("[1, 3]");
        expectCriterion("[..., 3]").minus("[1, 8]").toEqual("[..., 1)");
        expectCriterion("[..., 3]").minus("(1, 8]").toEqual("[..., 1]");
        expectCriterion("[1, 7]").minus("[3, ...]").toEqual("[1, 3)");

        expectCriterion("[1, 7]").minus("[3, 4]").toEqual("[1, 3) | (4, 7]");
        expectCriterion("(1, 7)").minus("[3, 4]").toEqual("(1, 3) | (4, 7)");
        expectCriterion("(1, 7)").minus("(3, 3)").toEqual("(1, 3] | [3, 7)");
        expectCriterion("[..., 7]").minus("[3, 4]").toEqual("[..., 3) | (4, 7]");
        expectCriterion("[..., 7]").minus("(3, 4)").toEqual("[..., 3] | [4, 7]");
        expectCriterion("[1, ...]").minus("[3, 4]").toEqual("[1, 3) | (4, ...]");
        expectCriterion("[1, ...]").minus("(3, 4)").toEqual("[1, 3] | [4, ...]");
        expectCriterion("[1, 7]").minus("(1, 7)").toEqual("[1, 1] | [7, 7]");

        expectCriterion("[1, 2]").minus("{ 2 }").toEqual("[1, 2)");
        expectCriterion("[1, 2]").minus("{ 1 }").toEqual("(1, 2]");
        expectCriterion("[1, 2]").minus("{ 1, 2 }").toEqual("(1, 2)");
        expectCriterion("[..., 2]").minus("{ 1, 2 }").toEqual("[..., 2)");
        expectCriterion("[1, ...]").minus("{ 1, 2 }").toEqual("(1, ...]");

        expectCriterion("[1, 3]").minus("{ 2 }").toEqual(false);
        expectCriterion("[1, 7]").minus("(7, 13]").toEqual(false);
        expectCriterion("[1, 7]").minus("[8, 13]").toEqual(false);
        expectCriterion("[1, 7]").minus("[..., 1)").toEqual(false);
        expectCriterion("[1, 7]").minus("[..., 0]").toEqual(false);
    });

    describe(AndCriterion, () => {
        expectCriterion("([2, 3] & true)").minus("[1, 7]").toEqual(true);

        expectCriterion("([3, 10] & true)").minus("[1, 7]").toEqual("((7, 10] & true)");
        expectCriterion("[1, 7]").minus("([3, 5] & true)").toEqual("(([1, 3) | (5, 7]) | ([3, 5] & !true))");
        expectCriterion("[1, 7]").minus("(true & [3, 5])").toEqual("(([1, 3) | (5, 7]) | ([3, 5] & !true))");
        expectCriterion("[4, 8]", test.skip).minus("([1, 7] & [5, 12])").toEqual("((7, 8] | [4, 5))");
        expectCriterion("({5} & [8, 10])").minus("[1, 7]").toEqual(true);
    });

    describe(OrCriterion, () => {
        expectCriterion("[1, 7] | [10, 13]").minus("[1, 13]").toEqual(true);
        expectCriterion("[1, 7] | [10, 13]").minus("[1, 12]").toEqual("(12, 13]");
        expectCriterion("[1, 7] | [10, 13]").minus("[7, 10]").toEqual("[1, 7) | (10, 13]");
    });

    describe(EntityCriterion, () => {
        interface FooBarBaz {
            foo: number;
            bar: number;
            baz: number;
        }

        expectCriterion("{ foo: { 2 }, bar: { 3, 4, 7 } }").minus("{ foo: { 2 }, bar: { 3, 4, 7 } }").toEqual(true);
        expectCriterion("{ foo: { 2 }, bar: { 3 } }").minus("{ foo: { 2 } }").toEqual(true);
        expectCriterion("{ foo: { 2 } }").minus("{ bar: { 2 } }").toEqual("{ foo: { 2 }, bar: !{ 2 } }");
        expectCriterion("{ foo: { 2 }, bar: { 3 } }")
            .minus("{ bar: { 3 }, baz: { 4 } }")
            .toEqual("{ foo: { 2 }, bar: { 3 }, baz: !{ 4 } }");

        expectCriterion("{ foo: { 3 } }").minus("{ foo: { 2 } }").toEqual(false);
        expectCriterion("{ foo: { 2 }, bar: { 3 } }").minus("{ foo: { 2 }, bar: { 4 } }").toEqual(false);
        expectCriterion("{ foo: { 2 }, bar: { 3, 4 } }")
            .minus("{ foo: { 2 }, bar: { 4 } }")
            .toEqual("{ foo: { 2 }, bar: { 3 } }");
        expectCriterion("{ foo: { 2 }, bar: { 3 }, baz: { 7 } }")
            .minus("{ foo: { 2 }, bar: { 4 }, baz: { 7, 8 } }")
            .toEqual(false);

        expectCriterion("{ foo: { 2, 3 } }").minus("{ foo: {3, 4} }").toEqual("{ foo: { 2 } }");
        expectCriterion("{ foo: { 2 } }").minus("{ foo: { 2 }, bar: { 3 } }").toEqual("{ foo: { 2 }, bar: !{ 3 } }");
        expectCriterion("{ foo: { 1, 2 }, bar: { 3 } }").minus("{ foo: { 2 } }").toEqual("{ foo: { 1 }, bar: { 3 } }");
        expectCriterion("{ foo: [1, 7] } }").minus("{ foo: [3, 4] }").toEqual("{ foo: ([1, 3) | (4, 7]) }");
        expectCriterion("{ foo: { bar: [1, 7] } }")
            .minus("{ foo: { bar: [3, 4] } }")
            .toEqual("{ foo: { bar: ([1, 3) | (4, 7]) } }");
        expectCriterion("{ foo: { 1, 2 }, bar: { 3 } }")
            .minus("{ foo: { 2 }, bar: {3, 4} }")
            .toEqual("{ foo: { 1 }, bar: { 3 } }");

        expectCriterion("{ foo: [1, 7] }")
            .minus("{ foo: [3, 4], bar: [150, 175] }")
            .toEqual("({ foo: ([1, 3) | (4, 7]) } | { foo: [3, 4], bar: ([..., 150) | (175, ...]) })");

        expectCriterion("{ foo: [1, 7], bar: [100, 200] }")
            .minus("{ foo: [3, 4], bar: [150, 175] }")
            .toEqual("({ foo: ([1, 3) | (4, 7]), bar: [100, 200] } | { foo: [3, 4], bar: ([100, 150) | (175, 200]) })");

        {
            expectCriterion("{ foo: [1, 7] }")
                .minus("{ foo: [3, 4], bar: [150, 175] }")
                .toEqual("{ foo: [1, 3) | (4, 7] } | { foo: [3, 4], bar: ([..., 150) | (175, ...]) }");
            expectCriterion("{ foo: [1, 7] }")
                .minus("{ bar: [150, 175], foo: [3, 4] }")
                .toEqual("{ foo: [1, 3) | (4, 7] } | { foo: [3, 4], bar: ([..., 150) | (175, ...]) }");
        }

        expectCriterion("{ foo: [1, 7], bar: [100, 200], baz: [50, 70] }")
            .minus("{ foo: [3, 4], bar: [150, 175] }")
            .toEqual(
                "({ foo: ([1, 3) | (4, 7]), bar: [100, 200], baz: [50, 70] } | { foo: [3, 4], bar: ([100, 150) | (175, 200]), baz: [50, 70] })",
            );

        expectCriterion("{ foo: [1, 7], bar: [100, 200], baz: [50, 70] }")
            .minus("{ foo: [3, 4], bar: [150, 175], baz: [55, 65] }")
            .toEqual(
                "({ foo: ([1, 3) | (4, 7]), bar: [100, 200], baz: [50, 70] } | { foo: [3, 4], bar: ([100, 150) | (175, 200]), baz: [50, 70] } | { foo: [3, 4], bar: [150, 175], baz: ([50, 55) | (65, 70]) })",
            );

        expectCriterion("{ foo: [1, 7], bar: [100, 200] }")
            .minus("{ foo: [3, 4], bar: [150, 175], baz: [50, 70] }")
            .toEqual(
                "({ foo: ([1, 3) | (4, 7]), bar: [100, 200] } | { foo: [3, 4], bar: ([100, 150) | (175, 200]) } | { foo: [3, 4], bar: [150, 175], baz: ([..., 50) | (70, ...]) })",
            );

        expectCriterion("{ price: [100, 300], rating: [3, 7] }")
            .minus("({ price: [100, 200], rating: [3, 5] } | { price: (200, 300], rating: [3, 5] })")
            .toEqual("({ price: (200, 300], rating: (5, 7] } | { price: [100, 200], rating: (5, 7] })");

        it("changing order of criteria properties should still result in an equivalent outcome", (): void => {
            // arrange
            const a1 = where<FooBarBaz>({
                bar: inRange([100, 200]),
                foo: inRange([1, 7]),
            });

            const a2 = where<FooBarBaz>({
                foo: inRange([1, 7]),
                bar: inRange([100, 200]),
            });

            const b1 = where<FooBarBaz>({
                bar: inRange([150, 175]),
                foo: inRange([3, 4]),
            });

            const b2 = where<FooBarBaz>({
                foo: inRange([3, 4]),
                bar: inRange([150, 175]),
            });

            // act
            const subtracted_1 = subtractCriterion(a1, b1);
            const subtracted_2 = subtractCriterion(a2, b2);

            if (typeof subtracted_1 === "boolean" || typeof subtracted_2 === "boolean") {
                throw new Error("expected both subtractions to not be false/true");
            }

            const subtracted_1_by_2 = subtractCriterion(subtracted_1, subtracted_2);
            const subtracted_2_by_1 = subtractCriterion(subtracted_2, subtracted_1);

            // assert
            expect(subtracted_1_by_2).toEqual(true);
            expect(subtracted_2_by_1).toEqual(true);
        });
    });
});

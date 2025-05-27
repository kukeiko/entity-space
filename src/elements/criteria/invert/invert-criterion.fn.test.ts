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
import { invertCriterion } from "./invert-criterion.fn";

describe(invertCriterion, () => {
    describe(EqualsCriterion, () => {
        expectCriterion("true").inverted().toEqual("!true");
        expectCriterion("false").inverted().toEqual("!false");
        expectCriterion("null").inverted().toEqual("!null");
        expectCriterion("undefined").inverted().toEqual("!undefined");
    });

    describe(NotEqualsCriterion, () => {
        expectCriterion("!true").inverted().toEqual("true");
        expectCriterion("!false").inverted().toEqual("false");
        expectCriterion("!null").inverted().toEqual("null");
        expectCriterion("!undefined").inverted().toEqual("undefined");
    });

    describe(InArrayCriterion, () => {
        expectCriterion("{1, 2, 3}").inverted().toEqual("!{1, 2, 3}");
    });

    describe(NotInArrayCriterion, () => {
        expectCriterion("!{1, 2, 3}").inverted().toEqual("{1, 2, 3}");
    });

    describe(InRangeCriterion, () => {
        expectCriterion("[1, 7]").inverted().toEqual("[..., 1) | (7, ...]");
        expectCriterion("[1, 7)").inverted().toEqual("[..., 1) | [7, ...]");
        expectCriterion("(1, 7]").inverted().toEqual("[..., 1] | (7, ...]");
        expectCriterion("(1, 7)").inverted().toEqual("[..., 1] | [7, ...]");
        expectCriterion("[..., 7]").inverted().toEqual("(7, ...]");
        expectCriterion("[7, ...]").inverted().toEqual("[..., 7)");
    });

    describe(OrCriterion, () => {
        // [todo] i want case B to work instead of case A https://github.com/kukeiko/entity-space-archive/issues/88
        // case A:
        expectCriterion("[1, 7] | [10, 13]").inverted().toEqual("[..., 1) | (7, ...] | [..., 10) | (13, ...]");
        // case B:
        expectCriterion("[1, 7] | [10, 13]", test.skip).inverted().toEqual("[..., 1) | (7, 10) | (13, ...]");

        expectCriterion("(true)").inverted().toEqual("(!true)");
    });

    describe(AndCriterion, () => {
        expectCriterion("true & 1").inverted().toEqual("!true & !1");
        expectCriterion("true & (1 & 2)").inverted().toEqual("!true & !1 & !2");
    });

    describe(AndCriterion, () => {
        // [todo] want this case to work also. currently returns "([..., 1) | (7, ...] | odd)" which doesn't seem correct.
        // to solve this, it would also be a good idea to look at what i expect the result of inverting "even & [1, 7]" to be.
        // [note] ported this over, we no longer have "even" / "odd" - figure out what I wanted and check if still needed
        expectCriterion("[1, 7] & even", test.skip).inverted().toEqual("([..., 1) | (7, ...]) | ([1, 7] & odd)");
    });

    describe(EntityCriterion, () => {
        expectCriterion("{ foo: [0, 7] }").inverted().toEqual("{ foo: [..., 0) | (7, ...] }");
        expectCriterion("{ foo: [0, 7], bar: {1,2,3} }")
            .inverted()
            .toEqual("{ foo: [..., 0) | (7, ...] } | { foo: [0, 7], bar: !{1,2,3} }");
        expectCriterion("{ foo: [0, 7], bar: {1,2,3}, baz: 8 }")
            .inverted()
            .toEqual(
                "{ foo: [..., 0) | (7, ...] } | { foo: [0, 7], bar: !{1,2,3} } | { foo: [0, 7], bar: {1,2,3}, baz: !8}",
            );
    });

    it("should throw if passed an unknown Criterion", () => {
        // arrange
        class UnknownCriterion extends Criterion {
            override type = "i-am-not-real";

            override contains(_: unknown): boolean {
                return true;
            }

            override toString(): string {
                return "unknown";
            }
        }

        const invert = () => invertCriterion(new UnknownCriterion());

        // act & assert
        expect(invert).toThrowError("unknown criterion type: i-am-not-real");
    });
});

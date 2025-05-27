import { describe, test } from "vitest";
import { expectCriterion } from "../../testing/expect-criterion.fn";
import { EntityCriterion } from "../entity-criterion";
import { EqualsCriterion } from "../equals-criterion";
import { InArrayCriterion } from "../in-array-criterion";
import { InRangeCriterion } from "../in-range-criterion";
import { NotEqualsCriterion } from "../not-equals-criterion";
import { NotInArrayCriterion } from "../not-in-array-criterion";
import { OrCriterion } from "../or-criterion";
import { intersectCriterion } from "./intersect-criterion.fn";

describe(intersectCriterion, () => {
    describe(EqualsCriterion, () => {
        describe(EqualsCriterion, () => {
            expectCriterion("1").intersect("1").toEqual("1");
            expectCriterion("1").intersect("2").toEqual(false);
            expectCriterion("true").intersect("true").toEqual("true");
            expectCriterion("true").intersect("false").toEqual(false);
            expectCriterion("null").intersect("null").toEqual("null");
            expectCriterion("null").intersect("undefined").toEqual(false);
        });

        describe(InArrayCriterion, () => {
            expectCriterion("1").intersect("{-1, 0, 1}").toEqual("1");
            expectCriterion("1").intersect("{2}").toEqual(false);
        });

        describe(NotEqualsCriterion, () => {
            expectCriterion("1").intersect("!2").toEqual("1");
            expectCriterion("1").intersect("!1").toEqual(false);
        });

        describe(NotInArrayCriterion, () => {
            expectCriterion("1").intersect("!{2, 3}").toEqual("1");
            expectCriterion("1").intersect("!{1}").toEqual(false);
        });

        describe(InRangeCriterion, () => {
            expectCriterion("1").intersect("[1, 3]").toEqual("1");
            expectCriterion("3").intersect("[1, 3]").toEqual("3");
            expectCriterion("1").intersect("(1, 3]").toEqual(false);
            expectCriterion("3").intersect("[1, 3)").toEqual(false);
        });

        describe(EntityCriterion, () => {
            expectCriterion("1").intersect("{ foo: 1 }").toEqual(false);
        });
    });

    describe(InArrayCriterion, () => {
        describe(EqualsCriterion, () => {
            expectCriterion("{1, 2, 3}").intersect("2").toEqual("2");
        });

        describe(InArrayCriterion, () => {
            expectCriterion("{1, 2, 3}").intersect("{4}").toEqual(false);
        });

        describe(NotEqualsCriterion, () => {
            expectCriterion("{1, 2, 3}").intersect("!4").toEqual("{1, 2, 3}");
            expectCriterion("{1, 2, 3}").intersect("!2").toEqual("{1, 3}");
            expectCriterion("{1, 2}").intersect("!2").toEqual("1");
        });

        describe(NotInArrayCriterion, () => {
            expectCriterion("{1, 2, 3}").intersect("!{1, 2, 3}").toEqual(false);
            expectCriterion("{1, 2, 3}").intersect("!{1, 2}").toEqual("3");
        });

        describe(InRangeCriterion, () => {
            expectCriterion("{1, 2, 3}").intersect("[1, 2]").toEqual("{1, 2}");
            expectCriterion("{1, 2, 3}").intersect("(1, 2]").toEqual("2");
        });

        describe(EntityCriterion, () => {
            expectCriterion("{1, 2, 3}").intersect("{ foo: {1, 2, 3} }").toEqual(false);
        });
    });

    describe(NotEqualsCriterion, () => {
        describe(EqualsCriterion, () => {
            expectCriterion("!2").intersect("3").toEqual("3");
            expectCriterion("!2").intersect("2").toEqual(false);
        });

        describe(InArrayCriterion, () => {
            expectCriterion("!2").intersect("{ 3, 5 }").toEqual("{ 3, 5 }");
            expectCriterion("!2").intersect("{ 2, 3, 5 }").toEqual("{ 3, 5 }");
            expectCriterion("!2").intersect("{ 2, 5 }").toEqual("5");
            expectCriterion("!2").intersect("{ 2 }").toEqual(false);
        });

        describe(NotEqualsCriterion, () => {
            expectCriterion("!2").intersect("!3").toEqual("!{2, 3}");
            expectCriterion("!2").intersect("!2").toEqual("!2");
        });

        describe(NotInArrayCriterion, () => {
            expectCriterion("!2").intersect("!{ 2 }").toEqual("!2");
            expectCriterion("!2").intersect("!{ 2, 3 }").toEqual("!{ 2, 3 }");
            expectCriterion("!2").intersect("!{ 3, 5 }").toEqual("!{ 2, 3, 5 }");
        });

        describe(InRangeCriterion, () => {
            expectCriterion("!7").intersect("[1, 5]").toEqual("[1, 5]");
            expectCriterion("!1").intersect("[1, 7]").toEqual("(1, 7]");
            expectCriterion("!7").intersect("[1, 7]").toEqual("[1, 7)");
            expectCriterion("!3").intersect("[1, 7]").toEqual("[1, 3) | (3, 7]");
        });

        describe(EntityCriterion, () => {
            expectCriterion("!1").intersect("{ foo: !1 }").toEqual(false);
        });
    });

    describe(NotInArrayCriterion, () => {
        describe(EqualsCriterion, () => {
            expectCriterion("!{7}").intersect("8").toEqual("8");
        });

        describe(InArrayCriterion, () => {
            expectCriterion("!{2}").intersect("{1, 2, 3}").toEqual("{1, 3}");
            expectCriterion("!{2}").intersect("{1, 2}").toEqual("1");
        });

        describe(NotEqualsCriterion, () => {
            expectCriterion("!{7}").intersect("!7").toEqual("!7");
        });

        describe(NotInArrayCriterion, () => {
            expectCriterion("!{2}").intersect("!{7}").toEqual("!{2, 7}");
        });

        describe(InRangeCriterion, () => {
            expectCriterion("!{7}", test.skip).intersect("[1, 5]").toEqual("[1, 5]");
        });

        describe(EntityCriterion, () => {
            expectCriterion("!{1, 2, 3}").intersect("{ foo: !{1, 2, 3} }").toEqual(false);
        });
    });

    describe(InRangeCriterion, () => {
        expectCriterion("[1, 7]").intersect("[3, 5]").toEqual("[3, 5]");
        expectCriterion("[3, 5]").intersect("[1, 7]").toEqual("[3, 5]");
        expectCriterion("[1, 7]").intersect("[5, 9]").toEqual("[5, 7]");
        expectCriterion("[1, ...]").intersect("[3, ...]").toEqual("[3, ...]");
        expectCriterion("[..., 7]").intersect("[..., -1]").toEqual("[..., -1]");
        expectCriterion("[3, 7]").intersect("[1, 4]").toEqual("[3, 4]");
        expectCriterion("[1, 7]").intersect("[0, 8]").toEqual("[1, 7]");
        expectCriterion("[1, 7]").intersect("[8, 10]").toEqual(false);
        expectCriterion("[1, 7]").intersect("(3, 5)").toEqual("(3, 5)");
        expectCriterion("[1, 7]").intersect("1").toEqual("1");
        expectCriterion("[1, 7]").intersect("7").toEqual("7");
        expectCriterion("[1, 7]").intersect("5").toEqual("5");
        expectCriterion("[1, 7]").intersect("true").toEqual(false);
    });

    describe(EntityCriterion, () => {
        expectCriterion("{ price: [100, 300], rating: [3, 7] }")
            .intersect("{ price: [100, 200], rating: [3, 5] }")
            .toEqual("{ price: [100, 200], rating: [3, 5] }");

        expectCriterion("{ price: [100, 300], rating: [3, 7] }")
            .intersect("{ price: [100, 200], rating: [3, 5] } | { price: (200, 300], rating: [3, 5] }")
            .toEqual("{ price: [100, 200], rating: [3, 5] } | { price: (200, 300], rating: [3, 5] }");

        expectCriterion("{ foo: {1,2,3} }").intersect("{ foo: {2} }").toEqual("{ foo: 2 }");
        expectCriterion("{ foo: {1,2,3} }").intersect("{ bar: {2} }").toEqual("{ foo: {1,2,3}, bar: {2} }");
        expectCriterion("{ foo: {1,2,3} }").intersect("{ foo: {4,5,6} }").toEqual(false);
        expectCriterion("{ foo: 1, bar: 2 }", test.skip)
            .intersect("{ foo: 1 } | { bar: 2 }")
            .toEqual("{ foo: 1, bar: 2 }");
        expectCriterion("{ foo: 1, bar: 2 }").intersect("{ foo: 1 } | { bar: 3 }").toEqual("{ foo: 1, bar: 2 }");
        expectCriterion("{ foo: 1, bar: 2 }").intersect("{ foo: 1 } & { bar: 3 }").toEqual(false);
        expectCriterion("{ foo: 1, bar: 2 }").intersect("5").toEqual(false);
        expectCriterion("{ foo: 1, bar: 2 }", test.skip)
            .intersect("{ foo: 1 } & { bar: 2 }")
            .toEqual("{ foo: 1, bar: 2 }");
    });

    describe(OrCriterion, () => {
        expectCriterion("[1, 7] | [10, 13]").intersect("[3, 9]").toEqual("[3, 7]");
        expectCriterion("[1, 7] | [10, 13]").intersect("[3, 11]").toEqual("[3, 7] | [10, 11]");
        expectCriterion("[1, 7] | [10, 13]").intersect("[3, 11] | [13, 17]").toEqual("[3, 7] | [10, 11] | [13, 13]");
    });
});

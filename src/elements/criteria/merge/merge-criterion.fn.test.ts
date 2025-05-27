import { describe } from "vitest";
import { expectCriterion } from "../../testing/expect-criterion.fn";
import { EntityCriterion } from "../entity-criterion";
import { EqualsCriterion } from "../equals-criterion";
import { InArrayCriterion } from "../in-array-criterion";
import { InRangeCriterion } from "../in-range-criterion";
import { NotEqualsCriterion } from "../not-equals-criterion";
import { NotInArrayCriterion } from "../not-in-array-criterion";
import { OrCriterion } from "../or-criterion";
import { mergeCriterion } from "./merge-criterion.fn";

describe(mergeCriterion, () => {
    describe(EqualsCriterion, () => {
        expectCriterion("true").plus("true").toEqual("true");
        expectCriterion("true").plus("false").toEqual("{true, false}");
        expectCriterion("false").plus("false").toEqual("false");
        expectCriterion("null").plus("null").toEqual("null");
        expectCriterion("1").plus("{ 1, 2 }").toEqual("{ 1, 2 }");
        expectCriterion("1").plus("{ 2, 3 }").toEqual("{ 1, 2, 3 }");
        expectCriterion("1").plus("{ foo: 1 }").toEqual(false);
        expectCriterion("1").plus("!1").toEqual(true);
        expectCriterion("1").plus("!2").toEqual("!2");
    });

    describe(NotEqualsCriterion, () => {
        expectCriterion("!null").plus("!null").toEqual("!null");
    });

    describe(InRangeCriterion, () => {
        expectCriterion("[1, 7]").plus("[3, 5]").toEqual("[1, 7]");
        expectCriterion("[3, 5]").plus("[1, 7]").toEqual("[1, 7]");
        expectCriterion("[1, 7]").plus("[3, 9]").toEqual("[1, 9]");
        expectCriterion("[3, 9]").plus("[1, 7]").toEqual("[1, 9]");
        expectCriterion("[1, 7]").plus("[8, 9]").toEqual("[1, 9]");
        expectCriterion("[8, 9]").plus("[1, 7]").toEqual("[1, 9]");
        expectCriterion("[1, ...]").plus("[3, 5]").toEqual("[1, ...]");
        expectCriterion("[..., 7]").plus("[3, 5]").toEqual("[..., 7]");
        expectCriterion("[1, 3]").plus("[5, 7]").toEqual(false);
        expectCriterion("[1, 7]").plus("(7, 13]").toEqual("[1, 13]");
        expectCriterion("[1, 7]").plus("[-7, 1)").toEqual("[-7, 7]");
        expectCriterion("(7, ...]").plus("[..., 10)").toEqual(true);
        expectCriterion("[..., 8)").plus("[7, ...]").toEqual(true);
    });

    describe(InArrayCriterion, () => {
        expectCriterion("{ 1, 2, 3 }").plus("{4, 5, 6}").toEqual("{1, 2, 3, 4, 5, 6}");
        expectCriterion("{ 1, 2, 3 }").plus("4").toEqual("{ 1, 2, 3, 4 }");
        expectCriterion("{ 1, 2, 3 }").plus("{ foo: 1 }").toEqual(false);
    });

    describe(NotInArrayCriterion, () => {
        expectCriterion("!{ 1, 2, 3 }").plus("!{-1, 2, -3}").toEqual("!{2}");
        expectCriterion("!{ 1, 2, 3 }").plus("!2").toEqual("!2");
        expectCriterion("!{ 1, 2, 3 }").plus("!{4, 5, 6}").toEqual(true);
        expectCriterion("!{ 1, 2, 3 }").plus("{ 1, 2, 3 }").toEqual(true);
        expectCriterion("!{ 1, 2, 3 }").plus("{1, 2}").toEqual("!{3}");
        expectCriterion("!{ 1, 2, 3 }").plus("1").toEqual("!{2, 3}");
    });

    describe(OrCriterion, () => {
        expectCriterion("[1, 7] | [10, 20]").plus("[7, 10]").toEqual("[1, 20]");
        expectCriterion("[7, 10]").plus("[1, 7] | [10, 20]").toEqual("[1, 20]");
        expectCriterion("[1, 7]").plus("[7, 10] | [20, 30]").toEqual("[1, 10] | [20, 30]");
        expectCriterion("[1, 7] | [10, 20]").plus("[7, 10] | [20, 30]").toEqual("[1, 30]");
    });

    describe(EntityCriterion, () => {
        expectCriterion("{ price: [100, 200], rating: [3, 5] } | { price: [100, 300], rating: [5, 7] }")
            .plus("{ price: [0, 1000], rating: [0, 8] }")
            .toEqual("{ price: [0, 1000], rating: [0, 8] }");

        expectCriterion("{ foo: [1, 7] }").plus("{ foo: [3, 13] }").toEqual("{ foo: [1, 13] }");
        expectCriterion("{ foo: [1, 7] }").plus("{ foo: [8, 13] }").toEqual("{ foo: [1, 13] }");

        expectCriterion("{ foo: [1, 7], bar: [3, 5] }")
            .plus("{ foo: [1, 7], bar: [5, 7] }")
            .toEqual("{ foo: [1, 7], bar: [3, 7] }");

        expectCriterion("{ foo: [1, 7], bar: [3, 5] }")
            .plus("{ foo: [7, 13], bar: [3, 5] }")
            .toEqual("{ foo: [1, 13], bar: [3, 5] }");

        expectCriterion("{ foo: [1, 7], bar: [3, 5] }").plus("{ foo: [2, 6], bar: [5, 7] }").toEqual(false);
    });
});

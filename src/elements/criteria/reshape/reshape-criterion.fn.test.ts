import { Null, Primitive, Undefined } from "@entity-space/utils";
import { describe } from "vitest";
import { expectCriterion } from "../../testing/expect-criterion.fn";
import { CriterionShape } from "../criterion-shape";
import { EntityCriterionShape, PackedEntityCriterionShape } from "../entity-criterion-shape";
import { EqualsCriterionShape } from "../equals-criterion-shape";
import { InArrayCriterionShape } from "../in-array-criterion-shape";
import { InRangeCriterionShape } from "../in-range-criterion-shape";
import { NotEqualsCriterionShape } from "../not-equals-criterion-shape";
import { NotInArrayCriterionShape } from "../not-in-array-criterion-shape";
import { OrCriterionShape } from "../or-criterion-shape";
import { reshapeCriterion } from "./reshape-criterion.fn";

describe(reshapeCriterion, () => {
    const where = (required: PackedEntityCriterionShape, optional?: PackedEntityCriterionShape) =>
        new EntityCriterionShape(required, optional);
    const or = (shapes: CriterionShape[]) => new OrCriterionShape(shapes);
    const inRange = (valueType: typeof Number | typeof String) => new InRangeCriterionShape(valueType);
    const equals = (valueTypes: Primitive[]) => new EqualsCriterionShape(valueTypes);
    const inArray = (valueTypes: Primitive[]) => new InArrayCriterionShape(valueTypes);

    describe(EqualsCriterionShape, () => {
        expectCriterion("1")
            .reshapedUsing(new EqualsCriterionShape([Number]))
            .toEqual("1");

        expectCriterion("1")
            .reshapedUsing([new EqualsCriterionShape([String]), new EqualsCriterionShape([Number])])
            .toEqual("1");

        expectCriterion(`"1"`)
            .reshapedUsing(new EqualsCriterionShape([Number]))
            .toEqual(false);

        expectCriterion("{ 1, 2, 3 }")
            .reshapedUsing(new EqualsCriterionShape([Number]))
            .toEqual(["1", "2", "3"]);

        expectCriterion(`{ 1, "foo", 2, 3 }`)
            .reshapedUsing(new EqualsCriterionShape([Number]))
            .toEqual(["1", "2", "3"]);

        expectCriterion(`{ 1, "foo", 2, 3 }`)
            .reshapedUsing(new EqualsCriterionShape([String]))
            .toEqual([`"foo"`]);

        expectCriterion("{ 1, 2, 3 }")
            .reshapedUsing(new EqualsCriterionShape([String]))
            .toEqual(false);

        expectCriterion("[1, 7]")
            .reshapedUsing(new EqualsCriterionShape([Number]))
            .toEqual(false);
    });

    describe(InArrayCriterionShape, () => {
        expectCriterion("1")
            .reshapedUsing(new InArrayCriterionShape([Number]))
            .toEqual("{ 1 }");

        expectCriterion("{ 1, 2, 3 }")
            .reshapedUsing(new InArrayCriterionShape([Number]))
            .toEqual("{ 1, 2, 3 }");

        expectCriterion(`{ 1, 2, 3, "foo", undefined, null }`)
            .reshapedUsing(new InArrayCriterionShape([Number]))
            .toEqual("{ 1, 2, 3 }", [`{ "foo", null, undefined }`]);

        expectCriterion(`{ 1, 2, 3, "foo", true, undefined, null }`)
            .reshapedUsing(new InArrayCriterionShape([Number, String, Boolean, Undefined, Null]))
            .toEqual(`{ 1, 2, 3, "foo", null, true, undefined }`);
    });

    describe(NotEqualsCriterionShape, () => {
        expectCriterion("!1")
            .reshapedUsing(new NotEqualsCriterionShape([Number]))
            .toEqual("!1");

        expectCriterion("!1")
            .reshapedUsing([new NotEqualsCriterionShape([String]), new NotEqualsCriterionShape([Number])])
            .toEqual("!1");

        expectCriterion(`"!1"`)
            .reshapedUsing(new NotEqualsCriterionShape([Number]))
            .toEqual(false);

        expectCriterion("!{ 1, 2, 3 }")
            .reshapedUsing(new NotEqualsCriterionShape([Number]))
            .toEqual(["!1", "!2", "!3"]);

        expectCriterion(`!{ 1, "foo", 2, 3 }`)
            .reshapedUsing(new NotEqualsCriterionShape([Number]))
            .toEqual(["!1", "!2", "!3"]);

        expectCriterion(`!{ 1, "foo", 2, 3 }`)
            .reshapedUsing(new NotEqualsCriterionShape([String]))
            .toEqual([`!"foo"`]);

        expectCriterion("!{ 1, 2, 3 }")
            .reshapedUsing(new NotEqualsCriterionShape([String]))
            .toEqual(false);

        expectCriterion("[1, 7]")
            .reshapedUsing(new NotEqualsCriterionShape([Number]))
            .toEqual(false);
    });

    describe(NotInArrayCriterionShape, () => {
        expectCriterion("!1")
            .reshapedUsing(new NotInArrayCriterionShape([Number]))
            .toEqual("!{ 1 }");

        expectCriterion("!{ 1, 2, 3 }")
            .reshapedUsing(new NotInArrayCriterionShape([Number]))
            .toEqual("!{ 1, 2, 3 }");

        expectCriterion(`!{ 1, 2, 3, "foo", undefined, null }`)
            .reshapedUsing(new NotInArrayCriterionShape([Number]))
            .toEqual("!{ 1, 2, 3 }", [`!{ "foo", null, undefined }`]);

        expectCriterion(`!{ 1, 2, 3, "foo", true, undefined, null }`)
            .reshapedUsing(new NotInArrayCriterionShape([Number, String, Boolean, Undefined, Null]))
            .toEqual(`!{ 1, 2, 3, "foo", null, true, undefined }`);
    });

    describe(InRangeCriterionShape, () => {
        expectCriterion("[1, 7]").reshapedUsing(new InRangeCriterionShape(Number)).toEqual("[1, 7]");
        expectCriterion("[1, 7]").reshapedUsing(new InRangeCriterionShape(String)).toEqual(false);
        expectCriterion("1").reshapedUsing(new InRangeCriterionShape(Number)).toEqual("[1, 1]");
        expectCriterion(`"foo"`).reshapedUsing(new InRangeCriterionShape(Number)).toEqual(false);
        expectCriterion("{1, 2, 3}").reshapedUsing(new InRangeCriterionShape(Number)).toEqual(false);
    });

    describe(EntityCriterionShape, () => {
        expectCriterion("{ foo: { 1, 2, 3 } }")
            .reshapedUsing(where({ foo: Number }))
            .toEqual(["{ foo: 1 }", "{ foo: 2 }", "{ foo: 3 }"]);

        expectCriterion("{ foo: 1 }")
            .reshapedUsing(where({}, { bar: equals([Number]) }))
            .toEqual("{}");

        expectCriterion("{ foo: {1, 2}, bar: {4, 5} }")
            .reshapedUsing(
                where({
                    foo: equals([Number]),
                    bar: equals([Number]),
                }),
                "{ foo: is-value:number, bar: is-value:number }",
            )
            .toEqual(["{ foo: 1, bar: 4 }", "{ foo: 1, bar: 5 }", "{ foo: 2, bar: 4 }", "{ foo: 2, bar: 5 }"]);

        expectCriterion("{ foo: {1, 2}, bar: { baz: {4, 5} } }")
            .reshapedUsing(
                where({
                    foo: equals([Number]),
                    bar: where({ baz: equals([Number]) }),
                }),
                "{ foo: is-value:number, bar: { baz: is-value:number } }",
            )
            .toEqual([
                "{ foo: 1, bar: { baz: 4 } }",
                "{ foo: 1, bar: { baz: 5 } }",
                "{ foo: 2, bar: { baz: 4 } }",
                "{ foo: 2, bar: { baz: 5 } }",
            ]);

        expectCriterion("{ foo: ([1, 7] | [13, 37]) }")
            .reshapedUsing(where({ foo: inRange(Number) }), "{ foo: in-range:number }")
            .toEqual(["{ foo: [1, 7] }", "{ foo: [13, 37] }"]);

        expectCriterion("{ foo: ([1, 7] | [13, 37]), bar: 7 }")
            .reshapedUsing(where({ foo: inRange(Number) }), "{ foo: in-range:number }")
            .toEqual(["{ foo: [1, 7] }", "{ foo: [13, 37] }"]);

        expectCriterion("{ foo: {1, 2, 3}, bar: {13, 37} | [7, 64] }")
            .reshapedUsing(
                where({
                    foo: inArray([Number]),
                    bar: inArray([Number]),
                }),
                "{ foo: in-set:number, bar: in-set:number }",
            )
            .toEqual(["{ foo: { 1, 2, 3 }, bar: { 13, 37 } }"], ["{ foo: { 1, 2, 3 }, bar: ([7, 64]) }"]);

        expectCriterion("{ foo: {1, 2, 3} | [100, 200], bar: {13, 37} | [7, 64] }")
            .reshapedUsing(
                where({
                    foo: inArray([Number]),
                    bar: inArray([Number]),
                }),
                "{ foo: in-set:number, bar: in-set:number }",
            )
            .toEqual(
                ["{ foo: {1, 2, 3}, bar: {13, 37} }"],
                [
                    "{ foo: ([100, 200]), bar: ({ 13, 37 } | [7, 64]) }",
                    "{ foo: ({ 1, 2, 3 } | [100, 200]), bar: ([7, 64]) }",
                ],
            );

        expectCriterion("{ foo: {1, 2, 3} | [100, 200], bar: {13, 37} | [7, 64] } | { foo: ({4, 5, 6}) }")
            .reshapedUsing(
                where({ foo: inArray([Number]) }, { bar: inArray([Number]) }),
                "{ foo: in-set:number, bar?: in-set:number }",
            )
            .toEqual(
                ["{ foo: { 1, 2, 3 } }", "{ foo: { 4, 5, 6 } }"],
                ["{ foo: ([100, 200]), bar: ({ 13, 37 } | [7, 64]) }"],
            );
    });

    describe(OrCriterionShape, () => {
        expectCriterion("[1, 7]")
            .reshapedUsing(or([inRange(Number)]), "in-range:number")
            .toEqual("([1, 7])");

        expectCriterion("[1, 7]")
            .reshapedUsing(or([inArray([Number]), inRange(Number)]), "or(in-set:number, in-range:number)")
            .toEqual("([1, 7])");
    });

    expectCriterion("{1, 2, 3}")
        .reshapedUsing(or([equals([Number])]), "or(is-value:number)")
        .toEqual("(1 | 2 | 3)");

    expectCriterion("{ foo: {1, 2, 3} | [100, 200], bar: {13, 37} | [7, 64] }")
        .reshapedUsing(
            or([
                where({ foo: inArray([Number]), bar: inArray([Number]) }),
                where({ foo: inRange(Number), bar: inRange(Number) }),
            ]),
            "or({ foo: in-set:number, bar: in-set:number }, { foo: in-range:number, bar: in-range:number })",
        )
        .toEqual(
            ["({ foo: { 1, 2, 3 }, bar: { 13, 37 } } | { foo: [100, 200], bar: [7, 64] })"],
            ["({ foo: ([100, 200]), bar: ({ 13, 37 }) } | { foo: ({ 1, 2, 3 }), bar: ([7, 64]) })"],
        );

    expectCriterion("{ foo: {1, 2, 3} | [100, 200], bar: {13, 37} | [7, 64] }")
        .reshapedUsing(
            or([
                where({ foo: inArray([Number]), bar: inArray([Number]) }),
                where({ foo: inRange(Number), bar: inRange(Number) }),
                where({ foo: inArray([Number]) }),
            ]),
            "or({ foo: in-set:number, bar: in-set:number }, { foo: in-range:number, bar: in-range:number }, { foo: in-set:number })",
        )
        .toEqual(
            ["({ foo: [100, 200], bar: [7, 64] } | { foo: { 1, 2, 3 } })"],
            ["({ foo: ([100, 200]), bar: ({ 13, 37 }) })"],
        );
});

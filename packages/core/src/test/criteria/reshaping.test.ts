import { EntityCriteriaShapeTools } from "../../lib/criteria/entity-criteria-shape-tools";
import { IEntityCriteriaShapeTools } from "../../lib/criteria/entity-criteria-shape-tools.interface";
import { EntityCriteriaTools } from "../../lib/criteria/entity-criteria-tools";
import { IEntityCriteriaTools } from "../../lib/criteria/entity-criteria-tools.interface";
import { expectCriteria } from "./expect-criteria.fn";

// [todo] all tests should ignore order of remapped / open criteria
describe("criteria: reshaping", () => {
    const criteriaTools: IEntityCriteriaTools = new EntityCriteriaTools();
    const shapeTools: IEntityCriteriaShapeTools = new EntityCriteriaShapeTools({ criteriaTools: criteriaTools });
    const { inRange, or, inArray, equals, where, all } = shapeTools;

    expectCriteria("all").remappedUsing(all(), "all").toEqual("all");
    expectCriteria("[1, 7]").remappedUsing(all(), "all").toEqual(false);

    expectCriteria("[1, 7]").remappedUsing(inRange(Number), "in-range:number").toEqual("[1, 7]");

    expectCriteria("[1, 7]")
        .remappedUsing(or([inRange(Number)]), "in-range:number")
        .toEqual("([1, 7])");

    expectCriteria("[1, 7]")
        .remappedUsing(or([inArray([Number]), inRange(Number)]), "or(in-set:number, in-range:number)")
        .toEqual("([1, 7])");

    expectCriteria("[1, 7] | [10, 13]")
        .remappedUsing(inRange(Number), "in-range:number")
        .toEqual(["[1, 7]", "[10, 13]"]);

    expectCriteria("[1, 7] | [10, 13] | {1, 2, 3}")
        .remappedUsing(inRange(Number), "in-range:number")
        .toEqual(["[1, 7]", "[10, 13]"], ["{1, 2, 3}"]);

    expectCriteria("{1, 2, 3}")
        .remappedUsing(equals([Number]), "is-value:number")
        .toEqual(["1", "2", "3"]);

    expectCriteria("{1, 2, 3}")
        .remappedUsing(or([equals([Number])]), "or(is-value:number)")
        .toEqual("(1 | 2 | 3)");

    expectCriteria("{ foo: {1, 2, 3} }")
        .remappedUsing(where({ foo: equals([Number]) }), "{ foo: is-value:number }")
        .toEqual(["{ foo: 1 }", "{ foo: 2 }", "{ foo: 3 }"]);

    expectCriteria("{ foo: 1 }")
        .remappedUsing(where({}, { bar: equals([Number]) }))
        .toEqual("{}");

    expectCriteria("{ foo: {1, 2}, bar: {4, 5} }")
        .remappedUsing(
            where({
                foo: equals([Number]),
                bar: equals([Number]),
            }),
            "{ foo: is-value:number, bar: is-value:number }"
        )
        .toEqual(["{ foo: 1, bar: 4 }", "{ foo: 1, bar: 5 }", "{ foo: 2, bar: 4 }", "{ foo: 2, bar: 5 }"]);

    expectCriteria("{ foo: {1, 2}, bar: { baz: {4, 5} } }")
        .remappedUsing(
            where({
                foo: equals([Number]),
                bar: where({ baz: equals([Number]) }),
            }),
            "{ foo: is-value:number, bar: { baz: is-value:number } }"
        )
        .toEqual([
            "{ foo: 1, bar: { baz: 4 } }",
            "{ foo: 1, bar: { baz: 5 } }",
            "{ foo: 2, bar: { baz: 4 } }",
            "{ foo: 2, bar: { baz: 5 } }",
        ]);

    expectCriteria("{ foo: ([1, 7] | [13, 37]) }")
        .remappedUsing(where({ foo: inRange(Number) }), "{ foo: in-range:number }")
        .toEqual(["{ foo: [1, 7] }", "{ foo: [13, 37] }"]);

    expectCriteria("{ foo: ([1, 7] | [13, 37]), bar: 7 }")
        .remappedUsing(where({ foo: inRange(Number) }), "{ foo: in-range:number }")
        .toEqual(["{ foo: [1, 7] }", "{ foo: [13, 37] }"]);

    expectCriteria("{ foo: {1, 2, 3}, bar: {13, 37} | [7, 64] }")
        .remappedUsing(
            where({
                foo: inArray([Number]),
                bar: inArray([Number]),
            }),
            "{ foo: in-set:number, bar: in-set:number }"
        )
        .toEqual(["{ foo: {1, 2, 3}, bar: {13, 37} }"], ["{ foo: {1, 2, 3}, bar: ([7, 64]) }"]);

    expectCriteria("{ foo: {1, 2, 3} | [100, 200], bar: {13, 37} | [7, 64] }")
        .remappedUsing(
            where({
                foo: inArray([Number]),
                bar: inArray([Number]),
            }),
            "{ foo: in-set:number, bar: in-set:number }"
        )
        .toEqual(
            ["{ foo: {1, 2, 3}, bar: {13, 37} }"],
            ["{ foo: ([100, 200]), bar: ({13, 37} | [7, 64]) }", "{ foo: ({1, 2, 3} | [100, 200]), bar: ([7, 64]) }"]
        );

    expectCriteria("{ foo: {1, 2, 3} | [100, 200], bar: {13, 37} | [7, 64] } | { foo: ({4, 5, 6}) }")
        .remappedUsing(
            where({ foo: inArray([Number]) }, { bar: inArray([Number]) }),
            "{ foo: in-set:number, bar?: in-set:number }"
        )
        .toEqual(["{ foo: {1, 2, 3} }", "{ foo: {4, 5, 6} }"], ["{ foo: ([100, 200]), bar: ({13, 37} | [7, 64]) }"]);

    expectCriteria("{ foo: {1, 2, 3} | [100, 200], bar: {13, 37} | [7, 64] }")
        .remappedUsing(
            or([
                where({ foo: inArray([Number]), bar: inArray([Number]) }),
                where({ foo: inRange(Number), bar: inRange(Number) }),
            ]),
            "or({ foo: in-set:number, bar: in-set:number }, { foo: in-range:number, bar: in-range:number })"
        )
        .toEqual(
            ["({ foo: {1, 2, 3}, bar: {13, 37} } | { foo: [100, 200], bar: [7, 64] })"],
            ["({ foo: ([100, 200]), bar: ({13, 37}) } | { foo: ({1, 2, 3}), bar: ([7, 64]) })"]
        );

    expectCriteria("{ foo: {1, 2, 3} | [100, 200], bar: {13, 37} | [7, 64] }")
        .remappedUsing(
            or([
                where({ foo: inArray([Number]), bar: inArray([Number]) }),
                where({ foo: inRange(Number), bar: inRange(Number) }),
                where({ foo: inArray([Number]) }),
            ]),
            "or({ foo: in-set:number, bar: in-set:number }, { foo: in-range:number, bar: in-range:number }, { foo: in-set:number })"
        )
        .toEqual(
            ["({ foo: [100, 200], bar: [7, 64] } | { foo: {1, 2, 3} })"],
            ["({ foo: ([100, 200]), bar: ({13, 37}) })"]
        );
});
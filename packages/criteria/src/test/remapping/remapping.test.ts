import { inRangeShape } from "../../lib/templates/in-range-shape.fn";
import { inSetShape } from "../../lib/templates/in-set-shape.fn";
import { isValueShape } from "../../lib/templates/is-value-shape.fn";
import { namedShape } from "../../lib/templates/named-shape.fn";
import { orShape } from "../../lib/templates/or-shape.fn";
import { remapping } from "../tools/remapping.fn";

// [todo] all tests should ignore order of remapped / open criteria
describe("remapping", () => {
    remapping("[1, 7]").using(inRangeShape(Number), "in-range:number").shouldBe("[1, 7]");

    remapping("[1, 7]")
        .using(orShape(inRangeShape(Number)), "in-range:number")
        .shouldBe("([1, 7])");

    remapping("[1, 7]")
        .using(orShape(inSetShape(Number), inRangeShape(Number)), "or(in-set:number, in-range:number)")
        .shouldBe("([1, 7])");

    remapping("[1, 7] | [10, 13]").using(inRangeShape(Number), "in-range:number").shouldBe(["[1, 7]", "[10, 13]"]);

    remapping("[1, 7] | [10, 13] | {1, 2, 3}")
        .using(inRangeShape(Number), "in-range:number")
        .shouldBe(["[1, 7]", "[10, 13]"], ["{1, 2, 3}"]);

    remapping("{1, 2, 3}").using(isValueShape(Number), "is-value:number").shouldBe(["1", "2", "3"]);

    remapping("{1, 2, 3}")
        .using(orShape(isValueShape(Number)), "or(is-value:number)")
        .shouldBe("(1 | 2 | 3)");

    remapping("{ foo: {1, 2, 3} }")
        .using(namedShape({ foo: isValueShape(Number) }), "{ foo: is-value:number }")
        .shouldBe(["{ foo: 1 }", "{ foo: 2 }", "{ foo: 3 }"]);

    remapping("{ foo: {1, 2}, bar: {4, 5} }")
        .using(
            namedShape({ foo: isValueShape(Number), bar: isValueShape(Number) }),
            "{ foo: is-value:number, bar: is-value:number }"
        )
        .shouldBe(["{ foo: 1, bar: 4 }", "{ foo: 1, bar: 5 }", "{ foo: 2, bar: 4 }", "{ foo: 2, bar: 5 }"]);

    remapping("{ foo: {1, 2}, bar: { baz: {4, 5} } }")
        .using(
            namedShape({ foo: isValueShape(Number), bar: namedShape({ baz: isValueShape(Number) }) }),
            "{ foo: is-value:number, bar: { baz: is-value:number } }"
        )
        .shouldBe([
            "{ foo: 1, bar: { baz: 4 } }",
            "{ foo: 1, bar: { baz: 5 } }",
            "{ foo: 2, bar: { baz: 4 } }",
            "{ foo: 2, bar: { baz: 5 } }",
        ]);

    remapping("{ foo: ([1, 7] | [13, 37]) }")
        .using(namedShape({ foo: inRangeShape(Number) }), "{ foo: in-range:number }")
        .shouldBe(["{ foo: [1, 7] }", "{ foo: [13, 37] }"]);

    remapping("{ foo: ([1, 7] | [13, 37]), bar: 7 }")
        .using(namedShape({ foo: inRangeShape(Number) }), "{ foo: in-range:number }")
        .shouldBe(["{ foo: [1, 7] }", "{ foo: [13, 37] }"]);

    remapping("{ foo: {1, 2, 3}, bar: {13, 37} | [7, 64] }")
        .using(
            namedShape({ foo: inSetShape(Number), bar: inSetShape(Number) }),
            "{ foo: in-set:number, bar: in-set:number }"
        )
        .shouldBe(["{ foo: {1, 2, 3}, bar: {13, 37} }"], ["{ foo: {1, 2, 3}, bar: ([7, 64]) }"]);

    remapping("{ foo: {1, 2, 3} | [100, 200], bar: {13, 37} | [7, 64] }")
        .using(
            namedShape({ foo: inSetShape(Number), bar: inSetShape(Number) }),
            "{ foo: in-set:number, bar: in-set:number }"
        )
        .shouldBe(
            ["{ foo: {1, 2, 3}, bar: {13, 37} }"],
            ["{ foo: ([100, 200]), bar: ({13, 37} | [7, 64]) }", "{ foo: ({1, 2, 3} | [100, 200]), bar: ([7, 64]) }"]
        );

    remapping("{ foo: {1, 2, 3} | [100, 200], bar: {13, 37} | [7, 64] } | { foo: ({4, 5, 6}) }")
        .using(
            namedShape({ foo: inSetShape(Number) }, { bar: inSetShape(Number) }),
            "{ foo: in-set:number, bar?: in-set:number }"
        )
        .shouldBe(["{ foo: {1, 2, 3} }", "{ foo: {4, 5, 6} }"], ["{ foo: ([100, 200]), bar: ({13, 37} | [7, 64]) }"]);

    remapping("{ foo: {1, 2, 3} | [100, 200], bar: {13, 37} | [7, 64] }")
        .using(
            orShape(
                namedShape({ foo: inSetShape(Number), bar: inSetShape(Number) }),
                namedShape({ foo: inRangeShape(Number), bar: inRangeShape(Number) })
            ),
            "or({ foo: in-set:number, bar: in-set:number }, { foo: in-range:number, bar: in-range:number })"
        )
        .shouldBe(
            ["({ foo: {1, 2, 3}, bar: {13, 37} } | { foo: [100, 200], bar: [7, 64] })"],
            ["({ foo: ([100, 200]), bar: ({13, 37}) } | { foo: ({1, 2, 3}), bar: ([7, 64]) })"]
        );

    remapping("{ foo: {1, 2, 3} | [100, 200], bar: {13, 37} | [7, 64] }")
        .using(
            orShape(
                namedShape({ foo: inSetShape(Number), bar: inSetShape(Number) }),
                namedShape({ foo: inRangeShape(Number), bar: inRangeShape(Number) }),
                namedShape({ foo: inSetShape(Number) })
            ),
            "or({ foo: in-set:number, bar: in-set:number }, { foo: in-range:number, bar: in-range:number }, { foo: in-set:number })"
        )
        .shouldBe(
            ["({ foo: [100, 200], bar: [7, 64] } | { foo: {1, 2, 3} })"],
            ["({ foo: ([100, 200]), bar: ({13, 37}) })"]
        );
});

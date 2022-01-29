import { inRangeTemplate } from "../lib/templates/in-range-template.fn";
import { inSetTemplate } from "../lib/templates/in-set-template.fn";
import { isValueTemplate } from "../lib/templates/is-value-template.fn";
import { matchesTemplate } from "../lib/templates/matches-template.fn";
import { orTemplate } from "../lib/templates/or-template.fn";
import { remapping } from "./remapping.fn";

describe("remapping", () => {
    remapping("[1, 7]").using(inRangeTemplate(Number), "in-range:number").shouldBe("[1, 7]");

    remapping("[1, 7]")
        .using(orTemplate(inRangeTemplate(Number)), "in-range:number")
        .shouldBe("([1, 7])");

    remapping("[1, 7]")
        .using(orTemplate(inSetTemplate(Number), inRangeTemplate(Number)), "or(in-set:number, in-range:number)")
        .shouldBe("([1, 7])");

    remapping("[1, 7] | [10, 13]").using(inRangeTemplate(Number), "in-range:number").shouldBe(["[1, 7]", "[10, 13]"]);

    remapping("[1, 7] | [10, 13] | {1, 2, 3}")
        .using(inRangeTemplate(Number), "in-range:number")
        .shouldBe(["[1, 7]", "[10, 13]"], ["{1, 2, 3}"]);

    remapping("{1, 2, 3}").using(isValueTemplate(Number), "is-value:number").shouldBe(["1", "2", "3"]);

    remapping("{1, 2, 3}")
        .using(orTemplate(isValueTemplate(Number)), "or(is-value:number)")
        .shouldBe("(1 | 2 | 3)");

    remapping("{ foo: {1, 2, 3} }")
        .using(matchesTemplate({ foo: isValueTemplate(Number) }), "{ foo: is-value:number }")
        .shouldBe(["{ foo: 1 }", "{ foo: 2 }", "{ foo: 3 }"]);

    remapping("{ foo: {1, 2}, bar: {4, 5} }")
        .using(
            matchesTemplate({ foo: isValueTemplate(Number), bar: isValueTemplate(Number) }),
            "{ foo: is-value:number, bar: is-value:number }"
        )
        .shouldBe(["{ foo: 1, bar: 4 }", "{ foo: 1, bar: 5 }", "{ foo: 2, bar: 4 }", "{ foo: 2, bar: 5 }"]);

    remapping("{ foo: {1, 2}, bar: { baz: {4, 5} } }")
        .using(
            matchesTemplate({ foo: isValueTemplate(Number), bar: matchesTemplate({ baz: isValueTemplate(Number) }) }),
            "{ foo: is-value:number, bar: { baz: is-value:number } }"
        )
        .shouldBe([
            "{ foo: 1, bar: { baz: 4 } }",
            "{ foo: 1, bar: { baz: 5 } }",
            "{ foo: 2, bar: { baz: 4 } }",
            "{ foo: 2, bar: { baz: 5 } }",
        ]);

    remapping("{ foo: ([1, 7] | [13, 37]) }")
        .using(matchesTemplate({ foo: inRangeTemplate(Number) }), "{ foo: in-range:number }")
        .shouldBe(["{ foo: [1, 7] }", "{ foo: [13, 37] }"]);
});

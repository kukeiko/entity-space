import { EntityCriteriaTools } from "../../lib/criteria/entity-criteria-tools";
import { expectCriteria } from "../tools/expect-criteria.fn";

describe("criteria: subtractions", () => {
    const factory = new EntityCriteriaTools();
    let { inRange, where } = factory;

    {
        // binary
        expectCriteria("even").minus("even").toEqual(true);
        expectCriteria("even").minus("odd").toEqual(false);
        expectCriteria("odd").minus("odd").toEqual(true);
        expectCriteria("odd").minus("even").toEqual(false);
    }

    {
        // equals
        expectCriteria("7").minus("7").toEqual(true);
        expectCriteria("7").minus("3").toEqual(false);
        expectCriteria("1").minus("true").toEqual(false);
        expectCriteria("0").minus("false").toEqual(false);

        expectCriteria("true").minus("true").toEqual(true);
        expectCriteria("true").minus("false").toEqual(false);
        expectCriteria("true").minus("1").toEqual(false);

        expectCriteria("false").minus("false").toEqual(true);
        expectCriteria("false").minus("true").toEqual(false);
        expectCriteria("false").minus("0").toEqual(false);
        expectCriteria("false").minus("null").toEqual(false);

        expectCriteria("null").minus("null").toEqual(true);
        expectCriteria("null").minus("false").toEqual(false);
        expectCriteria("null").minus("true").toEqual(false);
    }

    {
        // not-equals
        expectCriteria("!7").minus("!7").toEqual(true);
        // [todo] shouldn't this be "3"?
        expectCriteria("!7").minus("!3").toEqual(false);
    }

    {
        // in-array
        expectCriteria("{1, 2, 3}").minus("{1, 2, 3}").toEqual(true);
        expectCriteria("{1, 2, 3}").minus("{1, 2, 3, 4}").toEqual(true);
        expectCriteria("{1, 2, 3}").minus("!{4}").toEqual(true);
        expectCriteria("{1, 2, 3}").minus("[1, 3]").toEqual(true);

        expectCriteria("{1, 2, 3}").minus("{1, 2, 4}").toEqual("{3}");
        expectCriteria("{1, 2, 3}").minus("!{1}").toEqual("{1}");
        expectCriteria("{1, 2, 3}").minus("{4, 5, 6}").toEqual(false);
        expectCriteria("{1, 2, 3}").minus("!{1, 2, 3}").toEqual(false);
    }

    {
        // not-in-array
        expectCriteria("!{1, 2}").minus("!{1, 2}").toEqual(true);
        expectCriteria("!{1, 2}").minus("!{1}").toEqual(true);

        expectCriteria("!{1, 2}").minus("!{1, 2, 3}").toEqual("{3}");
        expectCriteria("!{1}").minus("!{2, 3}").toEqual("{2, 3}");
        expectCriteria("!{450}").minus("{450}").toEqual(false);
        expectCriteria("!{1, 2}").minus("{2, 3}").toEqual("!{1, 2, 3}");
        expectCriteria("!{1, 2, 3}").minus("[4, 7]").toEqual(false);
    }

    {
        // in-range
        expectCriteria("[1, 7]").minus("[1, 7]").toEqual(true);
        expectCriteria("[1, 7]").minus("[0, 8]").toEqual(true);
        expectCriteria("[1, 7]").minus("(0, 8)").toEqual(true);
        expectCriteria("[1, 7]").minus("[0, ...]").toEqual(true);
        expectCriteria("[4, ...]").minus("[3, ...]").toEqual(true);
        expectCriteria("[..., 4]").minus("[..., 5]").toEqual(true);
        expectCriteria("[1, 7]").minus("[..., 9]").toEqual(true);

        expectCriteria("[1, 7]").minus("[-3, 5]").toEqual("(5, 7]");
        expectCriteria("[3, ...]").minus("[1, 8]").toEqual("(8, ...]");
        expectCriteria("[3, ...]").minus("[1, 8)").toEqual("[8, ...]");
        expectCriteria("[1, 7]").minus("[..., 3)").toEqual("[3, 7]");

        expectCriteria("[1, 7]").minus("[3, 10]").toEqual("[1, 3)");
        expectCriteria("[1, 7]").minus("(3, 8]").toEqual("[1, 3]");
        expectCriteria("[..., 3]").minus("[1, 8]").toEqual("[..., 1)");
        expectCriteria("[..., 3]").minus("(1, 8]").toEqual("[..., 1]");
        expectCriteria("[1, 7]").minus("[3, ...]").toEqual("[1, 3)");

        expectCriteria("[1, 7]").minus("[3, 4]").toEqual("[1, 3) | (4, 7]");
        expectCriteria("(1, 7)").minus("[3, 4]").toEqual("(1, 3) | (4, 7)");
        expectCriteria("(1, 7)").minus("(3, 3)").toEqual("(1, 3] | [3, 7)");
        expectCriteria("[..., 7]").minus("[3, 4]").toEqual("[..., 3) | (4, 7]");
        expectCriteria("[..., 7]").minus("(3, 4)").toEqual("[..., 3] | [4, 7]");
        expectCriteria("[1, ...]").minus("[3, 4]").toEqual("[1, 3) | (4, ...]");
        expectCriteria("[1, ...]").minus("(3, 4)").toEqual("[1, 3] | [4, ...]");
        expectCriteria("[1, 7]").minus("(1, 7)").toEqual("[1, 1] | [7, 7]");

        expectCriteria("[1, 2]").minus("{2}").toEqual("[1, 2)");
        expectCriteria("[1, 2]").minus("{1}").toEqual("(1, 2]");
        expectCriteria("[1, 2]").minus("{1, 2}").toEqual("(1, 2)");
        expectCriteria("[..., 2]").minus("{1, 2}").toEqual("[..., 2)");
        expectCriteria("[1, ...]").minus("{1, 2}").toEqual("(1, ...]");

        expectCriteria("[1, 3]").minus("{2}").toEqual(false);
        expectCriteria("[1, 7]").minus("(7, 13]").toEqual(false);
        expectCriteria("[1, 7]").minus("[8, 13]").toEqual(false);
        expectCriteria("[1, 7]").minus("[..., 1)").toEqual(false);
        expectCriteria("[1, 7]").minus("[..., 0]").toEqual(false);
    }

    {
        // and-criteria
        expectCriteria("([2, 3] & even)").minus("[1, 7]").toEqual(true);

        expectCriteria("([3, 10] & even)").minus("[1, 7]").toEqual("((7, 10] & even)");
        expectCriteria("[1, 7]").minus("([3, 5] & even)").toEqual("(([1, 3) | (5, 7]) | ([3, 5] & odd))");
        expectCriteria("[1, 7]").minus("(even & [3, 5])").toEqual("(([1, 3) | (5, 7]) | ([3, 5] & odd))");
        // [todo] doesn't work yet, revisit
        expectCriteria("[4, 8]", xit).minus("([1, 7] & [5, 12])").toEqual("((7, 8] | [4, 5))");

        // [todo] string-fn criteria not yet implemented
        expectCriteria("starts-with(foo)", xit)
            .minus("(starts-with(foo) & contains(bar) & ends-with(baz))")
            .toEqual("(starts-with(foo) & !(contains(bar) & ends-with(baz)))");

        expectCriteria("({5} & [8, 10])").minus("[1, 7]").toEqual(true);
    }

    {
        // or-criteria
        expectCriteria("[1, 7] | [10, 13]").minus("[1, 13]").toEqual(true);
        expectCriteria("[1, 7] | [10, 13]").minus("[1, 12]").toEqual("(12, 13]");
        expectCriteria("[1, 7] | [10, 13]").minus("[7, 10]").toEqual("[1, 7) | (10, 13]");
    }
    {
        // entity-criteria
        interface FooBarBaz {
            foo: number;
            bar: number;
            baz: number;
        }

        expectCriteria("{ foo:{2}, bar:{3,4,7} }").minus("{ foo:{2}, bar:{3,4,7} }").toEqual(true);
        expectCriteria("{ foo:{2}, bar:{3} }").minus("{ foo:{2} }").toEqual(true);
        expectCriteria("{ foo:{2} }").minus("{ bar:{2} }").toEqual("{ foo:{2}, bar:!{2} }");
        expectCriteria("{ foo:{2}, bar:{3} }").minus("{ bar:{3}, baz:{4} }").toEqual("{ foo:{2}, bar:{3}, baz:!{4} }");

        expectCriteria("{ foo:{3} }").minus("{ foo:{2} }").toEqual(false);
        expectCriteria("{ foo:{2}, bar:{3} }").minus("{ foo:{2}, bar:{4} }").toEqual(false);
        expectCriteria("{ foo:{2}, bar:{3,4} }").minus("{ foo:{2}, bar:{4} }").toEqual("{ foo:{2}, bar:{3} }");
        expectCriteria("{ foo:{2}, bar:{3}, baz:{7} }").minus("{ foo:{2}, bar:{4}, baz:{7, 8} }").toEqual(false);

        expectCriteria("{ foo:{2, 3} }").minus("{ foo:{3, 4} }").toEqual("{ foo:{2} }");
        expectCriteria("{ foo:{2} }").minus("{ foo:{2}, bar:{3} }").toEqual("{ foo:{2}, bar:!{3} }");
        expectCriteria("{ foo:{1, 2}, bar:{3} }").minus("{ foo:{2} }").toEqual("{ foo:{1}, bar:{3} }");
        expectCriteria("{ foo:[1, 7] } }").minus("{ foo:[3, 4] }").toEqual("{ foo:([1, 3) | (4, 7]) }");
        expectCriteria("{ foo:{ bar:[1, 7] } }")
            .minus("{ foo: { bar:[3, 4] } }")
            .toEqual("{ foo:{ bar:([1, 3) | (4, 7]) } }");
        expectCriteria("{ foo:{1, 2}, bar:{3} }").minus("{ foo:{2}, bar:{3, 4} }").toEqual("{ foo:{1}, bar:{3} }");

        expectCriteria("{ foo:[1, 7] }")
            .minus("{ foo:[3, 4], bar:[150, 175] }")
            .toEqual("({ foo:([1, 3) | (4, 7]) } | { foo:[3, 4], bar:([..., 150) | (175, ...]) })");
        // "({ foo:([1, 3) | (4, 7]) } | { foo:[3, 4], bar:([..., 150) | (175, ...]) })" reshaped with "i do not support filtering on property bar" should be "{ foo:[1, 7] }"

        expectCriteria("{ foo:[1, 7], bar:[100, 200] }")
            .minus("{ foo:[3, 4], bar:[150, 175] }")
            .toEqual("({ foo:([1, 3) | (4, 7]), bar:[100, 200] } | { foo:[3, 4], bar:([100, 150) | (175, 200]) })");

        {
            expectCriteria("{ foo:[1, 7] }")
                .minus("{ foo:[3, 4], bar:[150, 175] }")
                .toEqual("{ foo: [1, 3) | (4, 7] } | { foo: [3, 4], bar: ([..., 150) | (175, ...]) }");
            expectCriteria("{ foo:[1, 7] }")
                .minus("{ bar:[150, 175], foo:[3, 4] }")
                .toEqual("{ foo: [1, 3) | (4, 7] } | { foo: [3, 4], bar: ([..., 150) | (175, ...]) }");
        }

        expectCriteria("{ foo:[1, 7], bar:[100, 200], baz:[50, 70] }")
            .minus("{ foo:[3, 4], bar:[150, 175] }")
            .toEqual(
                "({ foo:([1, 3) | (4, 7]), bar:[100, 200], baz:[50, 70] } | { foo:[3, 4], bar:([100, 150) | (175, 200]), baz:[50, 70] })"
            );

        expectCriteria("{ foo:[1, 7], bar:[100, 200], baz:[50, 70] }")
            .minus("{ foo:[3, 4], bar:[150, 175], baz:[55, 65] }")
            .toEqual(
                "({ foo:([1, 3) | (4, 7]), bar:[100, 200], baz:[50, 70] } | { foo:[3, 4], bar:([100, 150) | (175, 200]), baz:[50, 70] } | { foo:[3, 4], bar:[150, 175], baz:([50, 55) | (65, 70]) })"
            );

        expectCriteria("{ foo:[1, 7], bar:[100, 200] }")
            .minus("{ foo:[3, 4], bar:[150, 175], baz:[50, 70] }")
            .toEqual(
                "({ foo:([1, 3) | (4, 7]), bar:[100, 200] } | { foo:[3, 4], bar:([100, 150) | (175, 200]) } | { foo:[3, 4], bar:[150, 175], baz:([..., 50) | (70, ...]) })"
            );

        // or-criteria does not optimize during subtraction
        expectCriteria("{ price: [100, 300], rating: [3, 7] }")
            .minus("({ price: [100, 200], rating:[3, 5] } | { price: (200, 300], rating: [3, 5] })")
            .toEqual("({ price: (200, 300], rating: (5, 7] } | { price: [100, 200], rating: (5, 7] })");

        it("changing order of criteria properties should still result in an equivalent outcome", (): void => {
            // arrange
            const a1 = where<FooBarBaz>({
                bar: inRange(100, 200),
                foo: inRange(1, 7),
            });

            const a2 = where<FooBarBaz>({
                foo: inRange(1, 7),
                bar: inRange(100, 200),
            });

            const b1 = where<FooBarBaz>({
                bar: inRange(150, 175),
                foo: inRange(3, 4),
            });

            const b2 = where<FooBarBaz>({
                foo: inRange(3, 4),
                bar: inRange(150, 175),
            });

            // act
            const subtracted_1 = b1.subtractFrom(a1);
            const subtracted_2 = b2.subtractFrom(a2);

            if (typeof subtracted_1 === "boolean" || typeof subtracted_2 === "boolean") {
                return fail("expected both subtractions to not be false/true");
            }

            const subtracted_1_by_2 = subtracted_2.subtractFrom(subtracted_1);
            const subtracted_2_by_1 = subtracted_1.subtractFrom(subtracted_2);

            // assert
            expect(subtracted_1_by_2).toEqual(true);
            expect(subtracted_2_by_1).toEqual(true);
        });
    }
});

import { matches } from "../../lib/criterion/named/matches.fn";
import { inRange } from "../../lib/criterion/range/in-range.fn";
import { subtracting } from "../tools/subtracting.fn";

describe("subtraction: named-criteria", () => {
    interface FooBarBaz {
        foo: number;
        bar: number;
        baz: number;
    }

    describe("full subtraction", () => {
        subtracting("{ foo:{2}, bar:{3,4,7} }").by("{ foo:{2}, bar:{3,4,7} }").shouldBe(true);
        subtracting("{ foo:{2}, bar:{3} }").by("{ foo:{2} }").shouldBe(true);
    });

    describe("no subtraction", () => {
        // [todo] need to figure out if we want A or B (or both, depending on something else)
        // A
        subtracting("{ foo:{2} }").by("{ bar:{2} }").shouldBe(false);
        // B
        // reducing("{ foo:{2} }").by("{ bar:{2} }").shouldBe("{ foo:{2} & bar:!{2} }");

        subtracting("{ foo:{3} }").by("{ foo:{2} }").shouldBe(false);
        subtracting("{ foo:{2}, bar:{3} }").by("{ foo:{2}, bar:{4} }").shouldBe(false);
        subtracting("{ foo:{2}, bar:{3,4} }").by("{ foo:{2}, bar:{4} }").shouldBe("{ foo:{2}, bar:{3} }");
        subtracting("{ foo:{2}, bar:{3}, baz:{7} }").by("{ foo:{2}, bar:{4}, baz:{7, 8} }").shouldBe(false);
    });

    describe("partial subtraction", () => {
        subtracting("{ foo:{2, 3} }").by("{ foo:{3, 4} }").shouldBe("{ foo:{2} }");
        subtracting("{ foo:{2} }").by("{ foo:{2}, bar:{3} }").shouldBe("{ foo:{2}, bar:!{3} }");
        subtracting("{ foo:{1, 2}, bar:{3} }").by("{ foo:{2} }").shouldBe("{ foo:{1}, bar:{3} }");
        subtracting("{ foo:[1, 7] } }").by("{ foo:[3, 4] }").shouldBe("{ foo:([1, 3) | (4, 7]) }");
        subtracting("{ foo:{ bar:[1, 7] } }")
            .by("{ foo: { bar:[3, 4] } }")
            .shouldBe("{ foo:{ bar:([1, 3) | (4, 7]) } }");
        subtracting("{ foo:{1, 2}, bar:{3} }").by("{ foo:{2}, bar:{3, 4} }").shouldBe("{ foo:{1}, bar:{3} }");

        subtracting("{ foo:[1, 7] }")
            .by("{ foo:[3, 4], bar:[150, 175] }")
            .shouldBe("({ foo:([1, 3) | (4, 7]) } | { foo:[3, 4], bar:([..., 150) | (175, ...]) })");
        // "({ foo:([1, 3) | (4, 7]) } | { foo:[3, 4], bar:([..., 150) | (175, ...]) })" remapped with "i do not support filtering on property bar" should be "{ foo:[1, 7] }"

        subtracting("{ foo:[1, 7], bar:[100, 200] }")
            .by("{ foo:[3, 4], bar:[150, 175] }")
            .shouldBe("({ foo:([1, 3) | (4, 7]), bar:[100, 200] } | { foo:[3, 4], bar:([100, 150) | (175, 200]) })");

        {
            subtracting("{ foo:[1, 7] }")
                .by("{ foo:[3, 4], bar:[150, 175] }")
                .shouldBe("{ foo: [1, 3) | (4, 7] } | { foo: [3, 4], bar: ([..., 150) | (175, ...]) }");
            subtracting("{ foo:[1, 7] }")
                .by("{ bar:[150, 175], foo:[3, 4] }")
                .shouldBe("{ foo: [1, 3) | (4, 7] } | { foo: [3, 4], bar: ([..., 150) | (175, ...]) }");
        }

        subtracting("{ foo:[1, 7], bar:[100, 200], baz:[50, 70] }")
            .by("{ foo:[3, 4], bar:[150, 175] }")
            .shouldBe(
                "({ foo:([1, 3) | (4, 7]), bar:[100, 200], baz:[50, 70] } | { foo:[3, 4], bar:([100, 150) | (175, 200]), baz:[50, 70] })"
            );

        subtracting("{ foo:[1, 7], bar:[100, 200], baz:[50, 70] }")
            .by("{ foo:[3, 4], bar:[150, 175], baz:[55, 65] }")
            .shouldBe(
                "({ foo:([1, 3) | (4, 7]), bar:[100, 200], baz:[50, 70] } | { foo:[3, 4], bar:([100, 150) | (175, 200]), baz:[50, 70] } | { foo:[3, 4], bar:[150, 175], baz:([50, 55) | (65, 70]) })"
            );

        subtracting("{ foo:[1, 7], bar:[100, 200] }")
            .by("{ foo:[3, 4], bar:[150, 175], baz:[50, 70] }")
            .shouldBe(
                "({ foo:([1, 3) | (4, 7]), bar:[100, 200] } | { foo:[3, 4], bar:([100, 150) | (175, 200]) } | { foo:[3, 4], bar:[150, 175], baz:([..., 50) | (70, ...]) })"
            );

        // or-criteria does not optimize during subtraction
        subtracting("{ price: [100, 300], rating: [3, 7] }")
            .by("({ price: [100, 200], rating:[3, 5] } | { price: (200, 300], rating: [3, 5] })")
            .shouldBe("({ price: (200, 300], rating: (5, 7] } | { price: [100, 200], rating: (5, 7] })");

        it("changing order of criteria properties should still result in an equivalent outcome", (): void => {
            // arrange
            const a1 = matches<FooBarBaz>({
                bar: inRange(100, 200),
                foo: inRange(1, 7),
            });

            const a2 = matches<FooBarBaz>({
                foo: inRange(1, 7),
                bar: inRange(100, 200),
            });

            const b1 = matches<FooBarBaz>({
                bar: inRange(150, 175),
                foo: inRange(3, 4),
            });

            const b2 = matches<FooBarBaz>({
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
    });
});

import { inRange, inSet, notInSet, matches, or } from "../../criterion";
import { freducing, reducing, xreducing } from "./reducing.fn";

describe("reducing: named-criteria", () => {
    interface FooBarBaz {
        foo: number;
        bar: number;
        baz: number;
    }

    describe("full reduction", () => {
        reducing("{ foo:{2}, bar:{3,4,7} }").by("{ foo:{2}, bar:{3,4,7} }").shouldBe(true);
        reducing("{ foo:{2}, bar:{3} }").by("{ foo:{2} }").shouldBe(true);
    });

    describe("no reduction", () => {
        // [todo] need to figure out if we want A or B (or both, depending on something else)
        // A
        reducing("{ foo:{2} }").by("{ bar:{2} }").shouldBe(false);
        // B
        // reducing("{ foo:{2} }").by("{ bar:{2} }").shouldBe("{ foo:{2} & bar:!{2} }");

        reducing("{ foo:{3} }").by("{ foo:{2} }").shouldBe(false);
        reducing("{ foo:{2}, bar:{3} }").by("{ foo:{2}, bar:{4} }").shouldBe(false);
        reducing("{ foo:{2}, bar:{3,4} }").by("{ foo:{2}, bar:{4} }").shouldBe("{ foo:{2}, bar:{3} }");
        reducing("{ foo:{2}, bar:{3}, baz:{7} }").by("{ foo:{2}, bar:{4}, baz:{7, 8} }").shouldBe(false);
    });

    describe("partial reduction", () => {
        reducing("{ foo:{2, 3} }").by("{ foo:{3, 4} }").shouldBe("{ foo:{2} }");
        reducing("{ foo:{2} }").by("{ foo:{2}, bar:{3} }").shouldBe("{ foo:{2}, bar:!{3} }");
        reducing("{ foo:{1, 2}, bar:{3} }").by("{ foo:{2} }").shouldBe("{ foo:{1}, bar:{3} }");
        reducing("{ foo:[1, 7] } }").by("{ foo:[3, 4] }").shouldBe("{ foo:([1, 3) | (4, 7]) }");
        reducing("{ foo:{ bar:[1, 7] } }").by("{ foo: { bar:[3, 4] } }").shouldBe("{ foo:{ bar:([1, 3) | (4, 7]) } }");
        reducing("{ foo:{1, 2}, bar:{3} }").by("{ foo:{2}, bar:{3, 4} }").shouldBe("{ foo:{1}, bar:{3} }");

        reducing("{ foo:[1, 7] }").by("{ foo:[3, 4], bar:[150, 175] }").shouldBe("({ foo:([1, 3) | (4, 7]) } | { foo:[3, 4], bar:([..., 150) | (175, ...]) })");
        // "({ foo:([1, 3) | (4, 7]) } | { foo:[3, 4], bar:([..., 150) | (175, ...]) })" remapped with "i do not support filtering on property bar" should be "{ foo:[1, 7] }"

        reducing("{ foo:[1, 7], bar:[100, 200] }")
            .by("{ foo:[3, 4], bar:[150, 175] }")
            .shouldBe("({ foo:([1, 3) | (4, 7]), bar:[100, 200] } | { foo:[3, 4], bar:([100, 150) | (175, 200]) })");

        {
            reducing("{ foo:[1, 7] }").by("{ foo:[3, 4], bar:[150, 175] }").shouldBe("{ foo: [1, 3) | (4, 7] } | { foo: [3, 4], bar: ([..., 150) | (175, ...]) }");
            reducing("{ foo:[1, 7] }").by("{ bar:[150, 175], foo:[3, 4] }").shouldBe("{ foo: [1, 3) | (4, 7] } | { foo: [3, 4], bar: ([..., 150) | (175, ...]) }");
        }

        reducing("{ foo:[1, 7], bar:[100, 200], baz:[50, 70] }")
            .by("{ foo:[3, 4], bar:[150, 175] }")
            .shouldBe("({ foo:([1, 3) | (4, 7]), bar:[100, 200], baz:[50, 70] } | { foo:[3, 4], bar:([100, 150) | (175, 200]), baz:[50, 70] })");

        reducing("{ foo:[1, 7], bar:[100, 200], baz:[50, 70] }")
            .by("{ foo:[3, 4], bar:[150, 175], baz:[55, 65] }")
            .shouldBe(
                "({ foo:([1, 3) | (4, 7]), bar:[100, 200], baz:[50, 70] } | { foo:[3, 4], bar:([100, 150) | (175, 200]), baz:[50, 70] } | { foo:[3, 4], bar:[150, 175], baz:([50, 55) | (65, 70]) })"
            );

        reducing("{ foo:[1, 7], bar:[100, 200] }")
            .by("{ foo:[3, 4], bar:[150, 175], baz:[50, 70] }")
            .shouldBe("({ foo:([1, 3) | (4, 7]), bar:[100, 200] } | { foo:[3, 4], bar:([100, 150) | (175, 200]) } | { foo:[3, 4], bar:[150, 175], baz:([..., 50) | (70, ...]) })");

        it("changing order of criteria properties should still result in an equivalent outcome", () => {
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
            const reduced1 = b1.reduce(a1);
            const reduced2 = b2.reduce(a2);

            if (typeof reduced1 === "boolean" || typeof reduced2 === "boolean") {
                return fail("expected both reductions to not be false/true");
            }

            const reduced_1_by_2 = reduced2.reduce(reduced1);
            const reduced_2_by_1 = reduced1.reduce(reduced2);

            // assert
            expect(reduced_1_by_2).toEqual(true);
            expect(reduced_2_by_1).toEqual(true);
        });
    });
});

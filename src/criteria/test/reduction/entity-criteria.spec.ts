import { inRange, inSet, notInSet, matches, or } from "../../value-criterion";
import { reducing } from "./reducing.fn";

describe("reducing: entity-criteria", () => {
    interface FooBarBaz {
        foo: number;
        bar: number;
        baz: number;
    }

    describe("full reduction", () => {
        reducing("{ foo:{2}, bar:{3, 4, 7} }").by("{ foo:{2}, bar:{3, 4, 7} }").is(true);
        reducing("{ foo:{2}, bar:{3} }").by("{ foo:{2} }").is(true);
        // [todo] figure out what to do with this
        // reducing("{ foo:{2}, bar:{3} }").by("{ }").is(true);

        // [todo] figure out what to do with this
        it("{ foo:{2}, bar:{3} } should be completely reduced by { }", () => {
            // arrange
            const a = matches<FooBarBaz>({
                foo: inSet([2]),
                bar: inSet([3]),
            });

            const b = matches<FooBarBaz>({});

            // act
            const reduced = b.reduce(a);

            // assert
            expect(reduced).toEqual(true);
        });
    });

    describe("partial reduction", () => {
        reducing("{ foo:{2, 3} }").by("{ foo:{3, 4} }").is("{ foo:{2} }");
        reducing("{ foo:{2} }").by("{ bar:{2} }").is("{ foo:{2}, bar:!{2} }");
        reducing("{ foo:{2} }").by("{ foo:{2}, bar:{3} }").is("{ foo:{2}, bar:!{3} }");
        reducing("{ foo:{1, 2}, bar:{3} }").by("{ foo:{2} }").is("{ foo:{1}, bar:{3} }");
        reducing("{ foo:{ bar:[1, 7] } }").by("{ foo: { bar:[3, 4] } }").is("{ foo:{ bar:([1, 3) | (4, 7]) } }");
        reducing("{ foo:{1, 2}, bar:{3} }").by("{ foo:{2}, bar:{3, 4} }").is("{ foo:{1}, bar:{3} }");

        reducing("{ foo:[1, 7], bar:[100, 200] }")
            .by("{ foo:[3, 4], bar:[150, 175] }")
            .is("({ foo:([1, 3) | (4, 7]), bar:[100, 200] } | { foo:[3, 4], bar:([100, 150) | (175, 200]) })");

        reducing("{ foo:[1, 7], bar:[100, 200], baz:[50, 70] }")
            .by("{ foo:[3, 4], bar:[150, 175] }")
            .is("({ foo:([1, 3) | (4, 7]), bar:[100, 200], baz:[50, 70] } | { foo:[3, 4], bar:([100, 150) | (175, 200]), baz:[50, 70] })");

        reducing("{ foo:[1, 7], bar:[100, 200], baz:[50, 70] }")
            .by("{ foo:[3, 4], bar:[150, 175], baz:[55, 65] }")
            .is(
                "({ foo:([1, 3) | (4, 7]), bar:[100, 200], baz:[50, 70] } | { foo:[3, 4], bar:([100, 150) | (175, 200]), baz:[50, 70] } | { foo:[3, 4], bar:[150, 175], baz:([50, 55) | (65, 70]) })"
            );

        reducing("{ foo:[1, 7], bar:[100, 200] }")
            .by("{ foo:[3, 4], bar:[150, 175], baz:[50, 70] }")
            .is("({ foo:([1, 3) | (4, 7]), bar:[100, 200] } | { foo:[3, 4], bar:([100, 150) | (175, 200]) } | { foo:[3, 4], bar:[150, 175], baz:([..., 50) | (70, ...]) })");

        // [todo] figure out what to do with this
        it("{ } reduced by { foo:{2}, bar:{4} } should be ({ foo:!{2} } | { foo:{2}, bar:!{4} })", () => {
            // arrange
            const a = matches<FooBarBaz>({});

            const b = matches<FooBarBaz>({
                foo: inSet([2]),
                bar: inSet([4]),
            });

            const expected = or([
                matches<FooBarBaz>({
                    foo: notInSet([2]),
                }),
                matches<FooBarBaz>({
                    foo: inSet([2]),
                    bar: notInSet([4]),
                }),
            ]);

            // act
            const reduced = b.reduce(a);

            // assert
            expect(reduced).toEqual(expected);
        });

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

    describe("no reduction", () => {
        reducing("{ foo:{3} }").by("{ foo:{2} }").is(false);
        reducing("{ foo:{2}, bar:{3} }").by("{ foo:{2}, bar:{4} }").is(false);
    });
});

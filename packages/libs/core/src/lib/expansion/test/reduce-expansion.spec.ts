import { Expansion } from "../expansion";
import { reduceExpansion } from "../reduce-expansion.fn";

describe("reduceExpansion()", () => {
    describe("full reduction", () => {
        it("{ foo, bar } should be completely reduced by { foo, bar }", () => {
            // arrange
            const a: Expansion = { foo: {}, bar: true };
            const b: Expansion = { foo: true, bar: {} };

            // act
            const reduced = reduceExpansion(a, b);

            // assert
            expect(reduced).toEqual({});
        });
    });

    describe("partial reduction", () => {
        it("{ foo, bar } reduced by { foo } should be { bar }", () => {
            // arrange
            const a: Expansion = { foo: true, bar: true };
            const b: Expansion = { foo: true };

            // act
            const reduced = reduceExpansion(a, b);

            // assert
            expect(reduced).toEqual({ bar: true });
        });

        it("{ foo: { bar, baz }, khaz: { mo } } reduced by { foo: { bar }, khaz: { mo, dan } } should be { foo: { baz } }", () => {
            // arrange
            const a: Expansion = { foo: { bar: true, baz: true }, khaz: { mo: true } };
            const b: Expansion = { foo: { bar: true }, khaz: { mo: true, dan: true } };

            // act
            const reduced = reduceExpansion(a, b);

            // assert
            expect(reduced).toEqual({ foo: { baz: true } });
        });
    });

    describe("no reduction", () => {
        it("{ foo, bar } should not be reduced by { baz }", () => {
            // arrange
            const a: Expansion = { foo: true, bar: true };
            const b: Expansion = { baz: true };

            // act
            const reduced = reduceExpansion(a, b);

            // assert
            expect(reduced).toEqual(false);
        });
    });
});

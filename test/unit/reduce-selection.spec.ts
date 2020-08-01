import { Selection, reduceSelection } from "src";

fdescribe("reduceSelection()", () => {
    describe("full reduction", () => {
        it("{ foo, bar } should be completely reduced by { foo, bar }", () => {
            // arrange
            const a: Selection = { foo: {}, bar: true };
            const b: Selection = { foo: true, bar: {} };

            // act
            const reduced = reduceSelection(a, b);

            // assert
            expect(reduced).toBeNull();
        });
    });

    describe("partial reduction", () => {
        it("{ foo, bar } reduced by { foo } should be { bar }", () => {
            // arrange
            const a: Selection = { foo: true, bar: true };
            const b: Selection = { foo: true };

            // act
            const reduced = reduceSelection(a, b);

            // assert
            expect(reduced).toEqual({ bar: true });
        });

        it("{ foo: { bar, baz }, khaz: { mo } } reduced by { foo: { bar }, khaz: { mo, dan } } should be { foo: { baz } }", () => {
            // arrange
            const a: Selection = { foo: { bar: true, baz: true }, khaz: { mo: true } };
            const b: Selection = { foo: { bar: true }, khaz: { mo: true, dan: true } };

            // act
            const reduced = reduceSelection(a, b);

            // assert
            expect(reduced).toEqual({ foo: { baz: true } });
        });
    });

    describe("no reduction", () => {
        it("{ foo, bar } should not be reduced by { baz }", () => {
            // arrange
            const a: Selection = { foo: true, bar: true };
            const b: Selection = { baz: true };

            // act
            const reduced = reduceSelection(a, b);

            // assert
            expect(reduced).toBe(a);
        });
    });
});

import { isSelectionSupersetOf, Selection, mergeSelections, reduceSelection } from "src";

describe("ModelSelection", () => {
    describe("merge()", () => {
        it("should merge { foo: true } and { bar: true } to create { foo: true, bar: true }", () => {
            // arrange
            const a: Selection.Untyped = { foo: true };
            const b: Selection.Untyped = { bar: true };

            // act
            const merged = mergeSelections(a, b);

            // assert
            expect(merged).toEqual({ foo: true, bar: true });
        });

        it("should merge { foo: { bar: true } } and { foo: { baz: true } } to create { foo: { bar: true, baz: true } }", () => {
            // arrange
            const a: Selection.Untyped = { foo: { bar: true } };
            const b: Selection.Untyped = { foo: { baz: true } };

            // act
            const merged = mergeSelections(a, b);

            // assert
            expect(merged).toEqual({ foo: { bar: true, baz: true } });
        });

        it("should merge { foo: true } and { foo: { bar: true } } to create { foo: { bar: true } }", () => {
            // arrange
            const a: Selection.Untyped = { foo: true };
            const b: Selection.Untyped = { foo: { bar: true } };

            // act
            const merged = mergeSelections(a, b);

            // assert
            expect(merged).toEqual({ foo: { bar: true } });
        });
    });

    describe("reduce()", () => {
        it("should reduce { foo: true, bar: true } by { foo: true } to create { bar: true }", () => {
            // arrange
            const a: Selection.Untyped = { foo: true, bar: true };
            const b: Selection.Untyped = { foo: true };

            // act
            const reduced = reduceSelection(a, b);

            // assert
            expect(reduced).toEqual({ bar: true });
        });

        it("should reduce { foo: true, bar: true } by { foo: true, bar: true } to create null", () => {
            // arrange
            const a: Selection.Untyped = { foo: true, bar: true };
            const b: Selection.Untyped = { foo: true, bar: true };

            // act
            const reduced = reduceSelection(a, b);

            // assert
            expect(reduced).toBeNull();
        });

        it("should not reduce { foo: true, bar: true } by { baz: true } and return same reference", () => {
            // arrange
            const a: Selection.Untyped = { foo: true, bar: true };
            const b: Selection.Untyped = { baz: true };

            // act
            const reduced = reduceSelection(a, b);

            // assert
            expect(reduced).toBe(a);
        });

        it("should reduce { foo: { bar: true, baz: true }, khaz: { mo: true } } by { foo: { bar: true }, khaz: { mo: true, dan: true } } to create { foo: { baz: true } }", () => {
            // arrange
            const a: Selection.Untyped = { foo: { bar: true, baz: true }, khaz: { mo: true } };
            const b: Selection.Untyped = { foo: { bar: true }, khaz: { mo: true, dan: true } };

            // act
            const reduced = reduceSelection(a, b);

            // assert
            expect(reduced).toEqual({ foo: { baz: true } });
        });

        it("{ foo: {} } reduced by { foo: {} } should be null", () => {
            // arrange
            const a: Selection.Untyped = { foo: {} };
            const b: Selection.Untyped = { foo: {} };

            // act
            const reduced = reduceSelection(a, b);

            // assert
            expect(reduced).toBeNull();
        });
    });

    describe("isSuperset()", () => {
        it("{ foo: true, bar: true } should be a superset of { foo: true }", () => {
            // arrange
            const a: Selection.Untyped = { foo: true, bar: true };
            const b: Selection.Untyped = { foo: true };

            // act
            const isSuperset = isSelectionSupersetOf(a, b);

            // assert
            expect(isSuperset).toBeTrue();
        });
    });
});

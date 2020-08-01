import { Selection, mergeSelections } from "src";

describe("mergeSelections()", () => {
    it("should merge { foo } and { bar } to create { foo, bar }", () => {
        // arrange
        const a: Selection = { foo: true };
        const b: Selection = { bar: true };

        // act
        const merged = mergeSelections(a, b);

        // assert
        expect(merged).toEqual({ foo: true, bar: true });
    });

    it("should merge { foo: { bar } } and { foo: { baz } } to create { foo: { bar, baz } }", () => {
        // arrange
        const a: Selection = { foo: { bar: true } };
        const b: Selection = { foo: { baz: true } };

        // act
        const merged = mergeSelections(a, b);

        // assert
        expect(merged).toEqual({ foo: { bar: true, baz: true } });
    });

    it("should merge { foo } and { foo: { bar } } to create { foo: { bar } }", () => {
        // arrange
        const a: Selection = { foo: true };
        const b: Selection = { foo: { bar: true } };

        // act
        const merged = mergeSelections(a, b);

        // assert
        expect(merged).toEqual({ foo: { bar: true } });
    });
});

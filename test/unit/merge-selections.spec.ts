import { Selection, mergeSelections } from "src";

describe("mergeSelections()", () => {
    it("should merge { foo: true } and { bar: true } to create { foo: true, bar: true }", () => {
        // arrange
        const a: Selection = { foo: true };
        const b: Selection = { bar: true };

        // act
        const merged = mergeSelections(a, b);

        // assert
        expect(merged).toEqual({ foo: true, bar: true });
    });

    it("should merge { foo: { bar: true } } and { foo: { baz: true } } to create { foo: { bar: true, baz: true } }", () => {
        // arrange
        const a: Selection = { foo: { bar: true } };
        const b: Selection = { foo: { baz: true } };

        // act
        const merged = mergeSelections(a, b);

        // assert
        expect(merged).toEqual({ foo: { bar: true, baz: true } });
    });

    it("should merge { foo: true } and { foo: { bar: true } } to create { foo: { bar: true } }", () => {
        // arrange
        const a: Selection = { foo: true };
        const b: Selection = { foo: { bar: true } };

        // act
        const merged = mergeSelections(a, b);

        // assert
        expect(merged).toEqual({ foo: { bar: true } });
    });
});

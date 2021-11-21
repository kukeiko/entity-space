import { Expansion, mergeExpansions } from "src";

describe("mergeExpansions()", () => {
    it("should merge { foo } and { bar } to create { foo, bar }", () => {
        // arrange
        const a: Expansion = { foo: true };
        const b: Expansion = { bar: true };

        // act
        const merged = mergeExpansions(a, b);

        // assert
        expect(merged).toEqual({ foo: true, bar: true });
    });

    it("should merge { foo: { bar } } and { foo: { baz } } to create { foo: { bar, baz } }", () => {
        // arrange
        const a: Expansion = { foo: { bar: true } };
        const b: Expansion = { foo: { baz: true } };

        // act
        const merged = mergeExpansions(a, b);

        // assert
        expect(merged).toEqual({ foo: { bar: true, baz: true } });
    });

    it("should merge { foo } and { foo: { bar } } to create { foo: { bar } }", () => {
        // arrange
        const a: Expansion = { foo: true };
        const b: Expansion = { foo: { bar: true } };

        // act
        const merged = mergeExpansions(a, b);

        // assert
        expect(merged).toEqual({ foo: { bar: true } });
    });
});

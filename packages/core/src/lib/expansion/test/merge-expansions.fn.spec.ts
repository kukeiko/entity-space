import { Expansion } from "../expansion";
import { ExpansionObject } from "../expansion-object";

function mergeExpansions(...objects: ExpansionObject[]): boolean | ExpansionObject {
    return Expansion.mergeObjects(...objects);
}

describe("mergeExpansions()", () => {
    it("should merge { foo } and { bar } to create { foo, bar }", () => {
        // arrange
        const a: ExpansionObject = { foo: true };
        const b: ExpansionObject = { bar: true };

        // act
        const merged = mergeExpansions(a, b);

        // assert
        expect(merged).toEqual({ foo: true, bar: true });
    });

    it("should merge { foo: { bar } } and { foo: { baz } } to create { foo: { bar, baz } }", () => {
        // arrange
        const a: ExpansionObject = { foo: { bar: true } };
        const b: ExpansionObject = { foo: { baz: true } };

        // act
        const merged = mergeExpansions(a, b);

        // assert
        expect(merged).toEqual({ foo: { bar: true, baz: true } });
    });

    it("should merge { foo } and { foo: { bar } } to create { foo: { bar } }", () => {
        // arrange
        const a: ExpansionObject = { foo: true };
        const b: ExpansionObject = { foo: { bar: true } };

        // act
        const merged = mergeExpansions(a, b);

        // assert
        expect(merged).toEqual({ foo: { bar: true } });
    });
});

import { UnpackedEntitySelection } from "../../lib/common/unpacked-entity-selection.type";
import { EntitySelection } from "../../lib/query/entity-selection";

function mergeIntersections(...objects: UnpackedEntitySelection[]): boolean | UnpackedEntitySelection {
    return EntitySelection.mergeValues(...objects);
}

describe("mergeExpansions()", () => {
    it("should merge { foo } and { bar } to create { foo, bar }", () => {
        // arrange
        const a: UnpackedEntitySelection = { foo: true };
        const b: UnpackedEntitySelection = { bar: true };

        // act
        const merged = mergeIntersections(a, b);

        // assert
        expect(merged).toEqual({ foo: true, bar: true });
    });

    it("should merge { foo: { bar } } and { foo: { baz } } to create { foo: { bar, baz } }", () => {
        // arrange
        const a: UnpackedEntitySelection = { foo: { bar: true } };
        const b: UnpackedEntitySelection = { foo: { baz: true } };

        // act
        const merged = mergeIntersections(a, b);

        // assert
        expect(merged).toEqual({ foo: { bar: true, baz: true } });
    });

    it("should merge { foo } and { foo: { bar } } to create { foo: { bar } }", () => {
        // arrange
        const a: UnpackedEntitySelection = { foo: true };
        const b: UnpackedEntitySelection = { foo: { bar: true } };

        // act
        const merged = mergeIntersections(a, b);

        // assert
        expect(merged).toEqual({ foo: { bar: true } });
    });
});

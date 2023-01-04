import { UnfoldedEntitySelection } from "@entity-space/common";
import { EntitySelection } from "../../lib/query/entity-selection";

function mergeIntersections(...objects: UnfoldedEntitySelection[]): boolean | UnfoldedEntitySelection {
    return EntitySelection.mergeValues(...objects);
}

describe("mergeExpansions()", () => {
    it("should merge { foo } and { bar } to create { foo, bar }", () => {
        // arrange
        const a: UnfoldedEntitySelection = { foo: true };
        const b: UnfoldedEntitySelection = { bar: true };

        // act
        const merged = mergeIntersections(a, b);

        // assert
        expect(merged).toEqual({ foo: true, bar: true });
    });

    it("should merge { foo: { bar } } and { foo: { baz } } to create { foo: { bar, baz } }", () => {
        // arrange
        const a: UnfoldedEntitySelection = { foo: { bar: true } };
        const b: UnfoldedEntitySelection = { foo: { baz: true } };

        // act
        const merged = mergeIntersections(a, b);

        // assert
        expect(merged).toEqual({ foo: { bar: true, baz: true } });
    });

    it("should merge { foo } and { foo: { bar } } to create { foo: { bar } }", () => {
        // arrange
        const a: UnfoldedEntitySelection = { foo: true };
        const b: UnfoldedEntitySelection = { foo: { bar: true } };

        // act
        const merged = mergeIntersections(a, b);

        // assert
        expect(merged).toEqual({ foo: { bar: true } });
    });
});

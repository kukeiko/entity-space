import { EntitySchema, EntitySelectionValue, UnfoldedEntitySelection } from "@entity-space/common";
import { EntitySelection } from "../../lib/query/entity-selection";

function intersectSelection(a: UnfoldedEntitySelection, b: UnfoldedEntitySelection): boolean | UnfoldedEntitySelection {
    const schema = new EntitySchema("foo");
    const intersected = new EntitySelection({ schema, value: b }).intersect(new EntitySelection({ schema, value: a }));

    if (typeof intersected === "boolean") {
        return intersected;
    } else {
        return intersected.getValue();
    }
}

describe("selection: intersect", () => {
    it("{ foo, bar } intersected with { foo } should be { foo }", () => {
        // arrange
        const a: EntitySelectionValue = { foo: true, bar: true };
        const b: EntitySelectionValue = { foo: true };
        const expected: EntitySelectionValue = { foo: true };

        // act
        const intersected_A_with_B = intersectSelection(a, b);
        const intersected_B_with_A = intersectSelection(b, a);

        // assert
        expect(intersected_A_with_B).toEqual(expected);
        expect(intersected_B_with_A).toEqual(expected);
    });

    it("{ foo, bar: { baz, khaz } } intersected with { bar: { baz } } should be { bar: { baz } }", () => {
        // arrange
        const a: EntitySelectionValue = { foo: true, bar: { baz: true, khaz: true } };
        const b: EntitySelectionValue = { bar: { baz: true } };
        const expected: EntitySelectionValue = { bar: { baz: true } };

        // act
        const intersected_A_with_B = intersectSelection(a, b);
        const intersected_B_with_A = intersectSelection(b, a);

        // assert
        expect(intersected_A_with_B).toEqual(expected);
        expect(intersected_B_with_A).toEqual(expected);
    });

    it("{ foo } intersected with { bar } should be false", () => {
        // arrange
        const a: EntitySelectionValue = { foo: true };
        const b: EntitySelectionValue = { bar: true };
        const expected = false;

        // act
        const intersected_A_with_B = intersectSelection(a, b);
        const intersected_B_with_A = intersectSelection(b, a);

        // assert
        expect(intersected_A_with_B).toEqual(expected);
        expect(intersected_B_with_A).toEqual(expected);
    });
});

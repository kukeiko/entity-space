import { EntitySchema, UnfoldedEntitySelection } from "@entity-space/common";
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
        const a: UnfoldedEntitySelection = { foo: true, bar: true };
        const b: UnfoldedEntitySelection = { foo: true };
        const expected: UnfoldedEntitySelection = { foo: true };

        // act
        const intersected_A_with_B = intersectSelection(a, b);
        const intersected_B_with_A = intersectSelection(b, a);

        // assert
        expect(intersected_A_with_B).toEqual(expected);
        expect(intersected_B_with_A).toEqual(expected);
    });

    it("{ foo, bar: { baz, khaz } } intersected with { bar: { baz } } should be { bar: { baz } }", () => {
        // arrange
        const a: UnfoldedEntitySelection = { foo: true, bar: { baz: true, khaz: true } };
        const b: UnfoldedEntitySelection = { bar: { baz: true } };
        const expected: UnfoldedEntitySelection = { bar: { baz: true } };

        // act
        const intersected_A_with_B = intersectSelection(a, b);
        const intersected_B_with_A = intersectSelection(b, a);

        // assert
        expect(intersected_A_with_B).toEqual(expected);
        expect(intersected_B_with_A).toEqual(expected);
    });

    it("{ foo } intersected with { bar } should be false", () => {
        // arrange
        const a: UnfoldedEntitySelection = { foo: true };
        const b: UnfoldedEntitySelection = { bar: true };
        const expected = false;

        // act
        const intersected_A_with_B = intersectSelection(a, b);
        const intersected_B_with_A = intersectSelection(b, a);

        // assert
        expect(intersected_A_with_B).toEqual(expected);
        expect(intersected_B_with_A).toEqual(expected);
    });
});

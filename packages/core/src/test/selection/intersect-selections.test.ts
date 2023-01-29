import { EntitySchema } from "../../lib/common/schema/entity-schema";
import { UnpackedEntitySelection } from "../../lib/common/unpacked-entity-selection.type";
import { EntitySelection } from "../../lib/query/entity-selection";

function intersectSelection(a: UnpackedEntitySelection, b: UnpackedEntitySelection): boolean | UnpackedEntitySelection {
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
        const a: UnpackedEntitySelection = { foo: true, bar: true };
        const b: UnpackedEntitySelection = { foo: true };
        const expected: UnpackedEntitySelection = { foo: true };

        // act
        const intersected_A_with_B = intersectSelection(a, b);
        const intersected_B_with_A = intersectSelection(b, a);

        // assert
        expect(intersected_A_with_B).toEqual(expected);
        expect(intersected_B_with_A).toEqual(expected);
    });

    it("{ foo, bar: { baz, khaz } } intersected with { bar: { baz } } should be { bar: { baz } }", () => {
        // arrange
        const a: UnpackedEntitySelection = { foo: true, bar: { baz: true, khaz: true } };
        const b: UnpackedEntitySelection = { bar: { baz: true } };
        const expected: UnpackedEntitySelection = { bar: { baz: true } };

        // act
        const intersected_A_with_B = intersectSelection(a, b);
        const intersected_B_with_A = intersectSelection(b, a);

        // assert
        expect(intersected_A_with_B).toEqual(expected);
        expect(intersected_B_with_A).toEqual(expected);
    });

    it("{ foo } intersected with { bar } should be false", () => {
        // arrange
        const a: UnpackedEntitySelection = { foo: true };
        const b: UnpackedEntitySelection = { bar: true };
        const expected = false;

        // act
        const intersected_A_with_B = intersectSelection(a, b);
        const intersected_B_with_A = intersectSelection(b, a);

        // assert
        expect(intersected_A_with_B).toEqual(expected);
        expect(intersected_B_with_A).toEqual(expected);
    });
});

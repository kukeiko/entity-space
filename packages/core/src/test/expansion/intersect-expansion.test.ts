import { ExpansionValue } from "@entity-space/common";
import { Expansion } from "../../lib/expansion/expansion";

function intersectExpansion(a: ExpansionValue, b: ExpansionValue): boolean | ExpansionValue {
    const intersected = new Expansion(b).intersect(new Expansion(a));

    if (typeof intersected === "boolean") {
        return intersected;
    } else {
        return intersected.getValue();
    }
}

describe("expansion: intersect", () => {
    it("{ foo, bar } intersected with { foo } should be { foo }", () => {
        // arrange
        const a: ExpansionValue = { foo: true, bar: true };
        const b: ExpansionValue = { foo: true };
        const expected: ExpansionValue = { foo: true };

        // act
        const intersected_A_with_B = intersectExpansion(a, b);
        const intersected_B_with_A = intersectExpansion(b, a);

        // assert
        expect(intersected_A_with_B).toEqual(expected);
        expect(intersected_B_with_A).toEqual(expected);
    });

    it("{ foo, bar: { baz, khaz } } intersected with { bar } should be { bar: { baz, khaz } }", () => {
        // arrange
        const a: ExpansionValue = { foo: true, bar: { baz: true, khaz: true } };
        const b: ExpansionValue = { bar: true };
        const expected: ExpansionValue = { bar: { baz: true, khaz: true } };

        // act
        const intersected_A_with_B = intersectExpansion(a, b);
        const intersected_B_with_A = intersectExpansion(b, a);

        // assert
        expect(intersected_A_with_B).toEqual(expected);
        expect(intersected_B_with_A).toEqual(expected);
    });

    it("{ foo } intersected with { bar } should be false", () => {
        // arrange
        const a: ExpansionValue = { foo: true };
        const b: ExpansionValue = { bar: true };
        const expected = false;

        // act
        const intersected_A_with_B = intersectExpansion(a, b);
        const intersected_B_with_A = intersectExpansion(b, a);

        // assert
        expect(intersected_A_with_B).toEqual(expected);
        expect(intersected_B_with_A).toEqual(expected);
    });
});

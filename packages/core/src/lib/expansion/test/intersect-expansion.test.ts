import { Expansion } from "../expansion";
import { ExpansionObject } from "../expansion-object";

function intersectExpansion(a: ExpansionObject, b: ExpansionObject): boolean | ExpansionObject {
    const intersected = new Expansion(b).intersect(new Expansion(a));

    if (typeof intersected === "boolean") {
        return intersected;
    } else {
        return intersected.getObject();
    }
}

describe("expansion: intersect", () => {
    it("{ foo, bar } intersected with { foo } should be { foo }", () => {
        // arrange
        const a: ExpansionObject = { foo: true, bar: true };
        const b: ExpansionObject = { foo: true };
        const expected: ExpansionObject = { foo: true };

        // act
        const intersected_A_with_B = intersectExpansion(a, b);
        const intersected_B_with_A = intersectExpansion(b, a);

        // assert
        expect(intersected_A_with_B).toEqual(expected);
        expect(intersected_B_with_A).toEqual(expected);
    });

    it("{ foo, bar: { baz, khaz } } intersected with { bar } should be { bar: { baz, khaz } }", () => {
        // arrange
        const a: ExpansionObject = { foo: true, bar: { baz: true, khaz: true } };
        const b: ExpansionObject = { bar: true };
        const expected: ExpansionObject = { bar: { baz: true, khaz: true } };

        // act
        const intersected_A_with_B = intersectExpansion(a, b);
        const intersected_B_with_A = intersectExpansion(b, a);

        // assert
        expect(intersected_A_with_B).toEqual(expected);
        expect(intersected_B_with_A).toEqual(expected);
    });

    it("{ foo } intersected with { bar } should be false", () => {
        // arrange
        const a: ExpansionObject = { foo: true };
        const b: ExpansionObject = { bar: true };
        const expected = false;

        // act
        const intersected_A_with_B = intersectExpansion(a, b);
        const intersected_B_with_A = intersectExpansion(b, a);

        // assert
        expect(intersected_A_with_B).toEqual(expected);
        expect(intersected_B_with_A).toEqual(expected);
    });
});

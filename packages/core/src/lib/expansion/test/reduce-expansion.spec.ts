import { Expansion } from "../expansion";
import { ExpansionObject } from "../expansion-object";

function reduceExpansion(a: ExpansionObject, b: ExpansionObject): boolean | ExpansionObject {
    const reduced = new Expansion(b).reduce(new Expansion(a));

    if (typeof reduced === "boolean") {
        return reduced;
    } else {
        return reduced.getObject();
    }
}

describe("reduceExpansion()", () => {
    describe("full reduction", () => {
        it("{ } reduced by { foo } should be true", () => {
            // arrange
            const a: ExpansionObject = {};
            const b: ExpansionObject = { foo: true };

            // act
            const reduced = reduceExpansion(a, b);

            // assert
            expect(reduced).toEqual(true);
        });

        it("{ foo, bar } should be completely reduced by { foo, bar }", () => {
            // arrange
            const a: ExpansionObject = { foo: {}, bar: true };
            const b: ExpansionObject = { foo: true, bar: {} };

            // act
            const reduced = reduceExpansion(a, b);

            // assert
            expect(reduced).toEqual(true);
        });
    });

    describe("partial reduction", () => {
        it("{ foo, bar } reduced by { foo } should be { bar }", () => {
            // arrange
            const a: ExpansionObject = { foo: true, bar: true };
            const b: ExpansionObject = { foo: true };

            // act
            const reduced = reduceExpansion(a, b);

            // assert
            expect(reduced).toEqual({ bar: true });
        });

        it("{ foo: { bar, baz }, khaz: { mo } } reduced by { foo: { bar }, khaz: { mo, dan } } should be { foo: { baz } }", () => {
            // arrange
            const a: ExpansionObject = { foo: { bar: true, baz: true }, khaz: { mo: true } };
            const b: ExpansionObject = { foo: { bar: true }, khaz: { mo: true, dan: true } };

            // act
            const reduced = reduceExpansion(a, b);

            // assert
            expect(reduced).toEqual({ foo: { baz: true } });
        });
    });

    describe("no reduction", () => {
        it("{ foo, bar } should not be reduced by { baz }", () => {
            // arrange
            const a: ExpansionObject = { foo: true, bar: true };
            const b: ExpansionObject = { baz: true };

            // act
            const reduced = reduceExpansion(a, b);

            // assert
            expect(reduced).toEqual(false);
        });

        it("{ foo } should not be reduced by { }", () => {
            // arrange
            const a: ExpansionObject = { foo: true };
            const b: ExpansionObject = {};

            // act
            const reduced = reduceExpansion(a, b);

            // assert
            expect(reduced).toEqual(false);
        });
    });
});

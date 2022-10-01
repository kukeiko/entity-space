import { ExpansionValue } from "@entity-space/common";
import { Expansion } from "../expansion";

function reduceExpansion(a: ExpansionValue, b: ExpansionValue): boolean | ExpansionValue {
    const reduced = new Expansion(b).reduce(new Expansion(a));

    if (typeof reduced === "boolean") {
        return reduced;
    } else {
        return reduced.getValue();
    }
}

describe("reduceExpansion()", () => {
    describe("full reduction", () => {
        it("{ } reduced by { foo } should be true", () => {
            // arrange
            const a: ExpansionValue = {};
            const b: ExpansionValue = { foo: true };

            // act
            const reduced = reduceExpansion(a, b);

            // assert
            expect(reduced).toEqual(true);
        });

        it("{ foo, bar } should be completely reduced by { foo, bar }", () => {
            // arrange
            const a: ExpansionValue = { foo: {}, bar: true };
            const b: ExpansionValue = { foo: true, bar: {} };

            // act
            const reduced = reduceExpansion(a, b);

            // assert
            expect(reduced).toEqual(true);
        });
    });

    describe("partial reduction", () => {
        it("{ foo, bar } reduced by { foo } should be { bar }", () => {
            // arrange
            const a: ExpansionValue = { foo: true, bar: true };
            const b: ExpansionValue = { foo: true };

            // act
            const reduced = reduceExpansion(a, b);

            // assert
            expect(reduced).toEqual({ bar: true });
        });

        it("{ foo: { bar, baz }, khaz: { mo } } reduced by { foo: { bar }, khaz: { mo, dan } } should be { foo: { baz } }", () => {
            // arrange
            const a: ExpansionValue = { foo: { bar: true, baz: true }, khaz: { mo: true } };
            const b: ExpansionValue = { foo: { bar: true }, khaz: { mo: true, dan: true } };

            // act
            const reduced = reduceExpansion(a, b);

            // assert
            expect(reduced).toEqual({ foo: { baz: true } });
        });
    });

    describe("no reduction", () => {
        it("{ foo, bar } should not be reduced by { baz }", () => {
            // arrange
            const a: ExpansionValue = { foo: true, bar: true };
            const b: ExpansionValue = { baz: true };

            // act
            const reduced = reduceExpansion(a, b);

            // assert
            expect(reduced).toEqual(false);
        });

        it("{ foo } should not be reduced by { }", () => {
            // arrange
            const a: ExpansionValue = { foo: true };
            const b: ExpansionValue = {};

            // act
            const reduced = reduceExpansion(a, b);

            // assert
            expect(reduced).toEqual(false);
        });
    });
});

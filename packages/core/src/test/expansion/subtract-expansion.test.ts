import { EntitySchema, ExpansionValue } from "@entity-space/common";
import { Expansion } from "../../lib/expansion/expansion";

function subtractExpansion(a: ExpansionValue, b: ExpansionValue): boolean | ExpansionValue {
    const rootSchema = new EntitySchema("foo");
    const fooSchema = new EntitySchema("foo");
    const barSchema = new EntitySchema("bar");
    const bazSchema = new EntitySchema("baz");
    const khazSchema = new EntitySchema("khaz");
    const moSchema = new EntitySchema("mo");
    fooSchema.addRelationProperty("bar", barSchema, "barId", "id").addRelationProperty("baz", bazSchema, "bazId", "id");

    khazSchema.addRelationProperty("mo", moSchema, "moId", "id");
    rootSchema
        .addRelationProperty("foo", fooSchema, "fooId", "id")
        .addRelationProperty("khaz", khazSchema, "khazId", "id");

    const subtracted = new Expansion({ schema: rootSchema, value: b }).subtractFrom(
        new Expansion({ schema: rootSchema, value: a })
    );

    if (typeof subtracted === "boolean") {
        return subtracted;
    } else {
        return subtracted.getValue();
    }
}

describe("subtractExpansion()", () => {
    describe("full subtraction", () => {
        it("{ } subtracted by { foo } should be true", () => {
            // arrange
            const a: ExpansionValue = {};
            const b: ExpansionValue = { foo: true };

            // act
            const subtracted = subtractExpansion(a, b);

            // assert
            expect(subtracted).toEqual(true);
        });

        it("{ foo, bar } should be completely subtracted by { foo, bar }", () => {
            // arrange
            const a: ExpansionValue = { foo: {}, bar: true };
            const b: ExpansionValue = { foo: true, bar: {} };

            // act
            const subtracted = subtractExpansion(a, b);

            // assert
            expect(subtracted).toEqual(true);
        });
    });

    describe("partial reduction", () => {
        it("{ foo, bar } subtracted by { foo } should be { bar }", () => {
            // arrange
            const a: ExpansionValue = { foo: true, bar: true };
            const b: ExpansionValue = { foo: true };

            // act
            const subtracted = subtractExpansion(a, b);

            // assert
            expect(subtracted).toEqual({ bar: true });
        });

        it("{ foo: { bar, baz }, khaz: { mo } } subtracted by { foo: { bar }, khaz: { mo, dan } } should be { foo: { baz } }", () => {
            // arrange
            const a: ExpansionValue = { foo: { bar: true, baz: true }, khaz: { mo: true } };
            const b: ExpansionValue = { foo: { bar: true }, khaz: { mo: true, dan: true } };

            // act
            const subtracted = subtractExpansion(a, b);

            // assert
            expect(subtracted).toEqual({ foo: { baz: true } });
        });
    });

    describe("no reduction", () => {
        it("{ foo, bar } should not be subtracted by { baz }", () => {
            // arrange
            const a: ExpansionValue = { foo: true, bar: true };
            const b: ExpansionValue = { baz: true };

            // act
            const subtracted = subtractExpansion(a, b);

            // assert
            expect(subtracted).toEqual(false);
        });

        it("{ foo } should not be subtracted by { }", () => {
            // arrange
            const a: ExpansionValue = { foo: true };
            const b: ExpansionValue = {};

            // act
            const subtracted = subtractExpansion(a, b);

            // assert
            expect(subtracted).toEqual(false);
        });
    });
});

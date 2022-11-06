import { EntitySchema, EntitySelectionValue } from "@entity-space/common";
import { EntitySelection } from "../../lib/query/entity-selection";

function subtractSelection(a: EntitySelectionValue, b: EntitySelectionValue): boolean | EntitySelectionValue {
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

    const subtracted = new EntitySelection({ schema: rootSchema, value: b }).subtractFrom(
        new EntitySelection({ schema: rootSchema, value: a })
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
            const a: EntitySelectionValue = {};
            const b: EntitySelectionValue = { foo: true };

            // act
            const subtracted = subtractSelection(a, b);

            // assert
            expect(subtracted).toEqual(true);
        });

        it("{ foo, bar } should be completely subtracted by { foo, bar }", () => {
            // arrange
            const a: EntitySelectionValue = { foo: {}, bar: true };
            const b: EntitySelectionValue = { foo: true, bar: {} };

            // act
            const subtracted = subtractSelection(a, b);

            // assert
            expect(subtracted).toEqual(true);
        });
    });

    describe("partial reduction", () => {
        it("{ foo, bar } subtracted by { foo } should be { bar }", () => {
            // arrange
            const a: EntitySelectionValue = { foo: true, bar: true };
            const b: EntitySelectionValue = { foo: true };

            // act
            const subtracted = subtractSelection(a, b);

            // assert
            expect(subtracted).toEqual({ bar: true });
        });

        it("{ foo: { bar, baz }, khaz: { mo } } subtracted by { foo: { bar }, khaz: { mo, dan } } should be { foo: { baz } }", () => {
            // arrange
            const a: EntitySelectionValue = { foo: { bar: true, baz: true }, khaz: { mo: true } };
            const b: EntitySelectionValue = { foo: { bar: true }, khaz: { mo: true, dan: true } };

            // act
            const subtracted = subtractSelection(a, b);

            // assert
            expect(subtracted).toEqual({ foo: { baz: true } });
        });
    });

    describe("no reduction", () => {
        it("{ foo, bar } should not be subtracted by { baz }", () => {
            // arrange
            const a: EntitySelectionValue = { foo: true, bar: true };
            const b: EntitySelectionValue = { baz: true };

            // act
            const subtracted = subtractSelection(a, b);

            // assert
            expect(subtracted).toEqual(false);
        });

        it("{ foo } should not be subtracted by { }", () => {
            // arrange
            const a: EntitySelectionValue = { foo: true };
            const b: EntitySelectionValue = {};

            // act
            const subtracted = subtractSelection(a, b);

            // assert
            expect(subtracted).toEqual(false);
        });
    });
});

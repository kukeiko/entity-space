import { EntitySchema, UnfoldedEntitySelection } from "@entity-space/common";
import { EntitySelection } from "../../lib/query/entity-selection";

function subtractSelection(a: UnfoldedEntitySelection, b: UnfoldedEntitySelection): boolean | UnfoldedEntitySelection {
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
            const a: UnfoldedEntitySelection = {};
            const b: UnfoldedEntitySelection = { foo: true };

            // act
            const subtracted = subtractSelection(a, b);

            // assert
            expect(subtracted).toEqual(true);
        });

        it("{ foo, bar } should be completely subtracted by { foo, bar }", () => {
            // arrange
            const a: UnfoldedEntitySelection = { foo: {}, bar: true };
            const b: UnfoldedEntitySelection = { foo: true, bar: {} };

            // act
            const subtracted = subtractSelection(a, b);

            // assert
            expect(subtracted).toEqual(true);
        });
    });

    describe("partial reduction", () => {
        it("{ foo, bar } subtracted by { foo } should be { bar }", () => {
            // arrange
            const a: UnfoldedEntitySelection = { foo: true, bar: true };
            const b: UnfoldedEntitySelection = { foo: true };

            // act
            const subtracted = subtractSelection(a, b);

            // assert
            expect(subtracted).toEqual({ bar: true });
        });

        it("{ foo: { bar, baz }, khaz: { mo } } subtracted by { foo: { bar }, khaz: { mo, dan } } should be { foo: { baz } }", () => {
            // arrange
            const a: UnfoldedEntitySelection = { foo: { bar: true, baz: true }, khaz: { mo: true } };
            const b: UnfoldedEntitySelection = { foo: { bar: true }, khaz: { mo: true, dan: true } };

            // act
            const subtracted = subtractSelection(a, b);

            // assert
            expect(subtracted).toEqual({ foo: { baz: true } });
        });
    });

    describe("no reduction", () => {
        it("{ foo, bar } should not be subtracted by { baz }", () => {
            // arrange
            const a: UnfoldedEntitySelection = { foo: true, bar: true };
            const b: UnfoldedEntitySelection = { baz: true };

            // act
            const subtracted = subtractSelection(a, b);

            // assert
            expect(subtracted).toEqual(false);
        });

        it("{ foo } should not be subtracted by { }", () => {
            // arrange
            const a: UnfoldedEntitySelection = { foo: true };
            const b: UnfoldedEntitySelection = {};

            // act
            const subtracted = subtractSelection(a, b);

            // assert
            expect(subtracted).toEqual(false);
        });
    });
});

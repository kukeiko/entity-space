import { EntitySchema } from "../../lib/schema/entity-schema";
import { UnpackedEntitySelection } from "../../lib/common/unpacked-entity-selection.type";
import { EntitySelection } from "../../lib/query/entity-selection";

function subtractSelection(a: UnpackedEntitySelection, b: UnpackedEntitySelection): boolean | UnpackedEntitySelection {
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
            const a: UnpackedEntitySelection = {};
            const b: UnpackedEntitySelection = { foo: true };

            // act
            const subtracted = subtractSelection(a, b);

            // assert
            expect(subtracted).toEqual(true);
        });

        it("{ foo, bar } should be completely subtracted by { foo, bar }", () => {
            // arrange
            const a: UnpackedEntitySelection = { foo: {}, bar: true };
            const b: UnpackedEntitySelection = { foo: true, bar: {} };

            // act
            const subtracted = subtractSelection(a, b);

            // assert
            expect(subtracted).toEqual(true);
        });
    });

    describe("partial subtraction", () => {
        it("{ foo, bar } subtracted by { foo } should be { bar }", () => {
            // arrange
            const a: UnpackedEntitySelection = { foo: true, bar: true };
            const b: UnpackedEntitySelection = { foo: true };

            // act
            const subtracted = subtractSelection(a, b);

            // assert
            expect(subtracted).toEqual({ bar: true });
        });

        it("{ foo: { bar, baz }, khaz: { mo } } subtracted by { foo: { bar }, khaz: { mo, dan } } should be { foo: { baz } }", () => {
            // arrange
            const a: UnpackedEntitySelection = { foo: { bar: true, baz: true }, khaz: { mo: true } };
            const b: UnpackedEntitySelection = { foo: { bar: true }, khaz: { mo: true, dan: true } };

            // act
            const subtracted = subtractSelection(a, b);

            // assert
            expect(subtracted).toEqual({ foo: { baz: true } });
        });
    });

    describe("no subtraction", () => {
        it("{ foo, bar } should not be subtracted by { baz }", () => {
            // arrange
            const a: UnpackedEntitySelection = { foo: true, bar: true };
            const b: UnpackedEntitySelection = { baz: true };

            // act
            const subtracted = subtractSelection(a, b);

            // assert
            expect(subtracted).toEqual(false);
        });

        it("{ foo } should not be subtracted by { }", () => {
            // arrange
            const a: UnpackedEntitySelection = { foo: true };
            const b: UnpackedEntitySelection = {};

            // act
            const subtracted = subtractSelection(a, b);

            // assert
            expect(subtracted).toEqual(false);
        });
    });
});

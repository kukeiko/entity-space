import { EntitySchema } from "../../lib/schema/entity-schema";

describe("entity-schema", () => {
    describe("getDefaultSelection()", () => {
        it("should return a selection with all required properties set", () => {
            // arrange
            const fooSchema = new EntitySchema("foo");
            fooSchema.addInteger("required", true);
            fooSchema.addString("optional");

            const barSchema = new EntitySchema("bar");
            barSchema.addString("required", true);
            barSchema.addInteger("optional");

            fooSchema.addProperty("bar", barSchema, true);
            const expected = { required: true, bar: { required: true } };

            // act
            const actual = fooSchema.getDefaultSelection();

            // assert
            expect(actual).toEqual(expected);
        });
    });
});

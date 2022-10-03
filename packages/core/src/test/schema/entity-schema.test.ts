import { EntitySchema } from "@entity-space/core";

describe("entity-schema", () => {
    describe("getDefaultExpansion()", () => {
        it("should return an expansion with all required properties set", () => {
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
            const actual = fooSchema.getDefaultExpansion();

            // assert
            expect(actual).toEqual(expected);
        });
    });
});

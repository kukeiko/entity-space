import { EntityBlueprint } from "../lib/schema/entity-blueprint";
import { define } from "../lib/schema/entity-blueprint-property";
import { EntitySchemaCatalog } from "../lib/schema/entity-schema-catalog";

describe("EntitySchemaCatalog", () => {
    describe("resolve()", () => {
        it("should support composite keys", () => {
            // arrange
            const compositeKeyPath = ["namespace", "id"];

            @EntityBlueprint({ id: "foo", key: compositeKeyPath })
            class FooBlueprint {
                id = define(Number, { required: true });
                namespace = define(String, { required: true });
            }

            // act
            const catalog = new EntitySchemaCatalog();
            catalog.resolve(FooBlueprint);
            const schema = catalog.getSchema("foo");
            const key = schema.getKey();

            // assert
            expect(key.getPaths()).toEqual(compositeKeyPath);
        });
    });
});

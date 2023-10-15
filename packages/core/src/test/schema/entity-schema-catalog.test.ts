import { EntityBlueprint } from "../../lib/schema/entity-blueprint";
import { define } from "../../lib/schema/entity-blueprint-property";
import { EntitySchemaCatalog } from "../../lib/schema/entity-schema-catalog";

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

        it("should apply the unique attribute to indexes", () => {
            // arrange
            @EntityBlueprint({ id: "foo" })
            class FooBlueprint {
                id = define(Number, { required: true, id: true });
                name = define(String, { required: true, index: true, unique: true });
            }

            // act
            const catalog = new EntitySchemaCatalog();
            catalog.resolve(FooBlueprint);
            const schema = catalog.getSchema("foo");
            const index = schema.getIndex("name");

            // assert
            expect(index.isUnique()).toEqual(true);
        });

        it("should create index even is only 'unique' flag is supplied", () => {
            // arrange
            @EntityBlueprint({ id: "foo" })
            class FooBlueprint {
                id = define(Number, { required: true, id: true });
                name = define(String, { required: true, unique: true });
            }

            // act
            const catalog = new EntitySchemaCatalog();
            catalog.resolve(FooBlueprint);
            const schema = catalog.getSchema("foo");
            const getIndex = () => schema.getIndex("name");

            // assert
            expect(getIndex).not.toThrow();
        });
    });
});

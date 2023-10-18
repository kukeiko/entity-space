import { EntityBlueprint } from "../../lib/schema/entity-blueprint";
import { define } from "../../lib/schema/entity-blueprint-property";
import { EntitySchemaCatalog } from "../../lib/schema/entity-schema-catalog";

describe(EntitySchemaCatalog.name, () => {
    describe(EntitySchemaCatalog.prototype.resolve.name, () => {
        it("should support composite keys", () => {
            // arrange
            const compositeKeyPath = ["namespace", "id"];

            @EntityBlueprint({ id: "foo", key: compositeKeyPath })
            class FooBlueprint {
                id = define(Number);
                namespace = define(String);
            }

            // act
            const catalog = new EntitySchemaCatalog();
            const schema = catalog.resolve(FooBlueprint);
            const key = schema.getKey();

            // assert
            expect(key.getPaths()).toEqual(compositeKeyPath);
        });

        it("should support the unique attribute", () => {
            // arrange
            @EntityBlueprint({ id: "foo" })
            class FooBlueprint {
                id = define(Number, { id: true });
                name = define(String, { index: true, unique: true });
            }

            // act
            const catalog = new EntitySchemaCatalog();
            const schema = catalog.resolve(FooBlueprint);
            const index = schema.getIndex("name");

            // assert
            expect(index.isUnique()).toEqual(true);
        });

        it("should automatically create an index if the unique attribute is set", () => {
            // arrange
            @EntityBlueprint({ id: "foo" })
            class FooBlueprint {
                id = define(Number, { id: true });
                name = define(String, { unique: true });
            }

            // act
            const catalog = new EntitySchemaCatalog();
            const schema = catalog.resolve(FooBlueprint);
            const getIndex = () => schema.getIndex("name");

            // assert
            expect(getIndex).not.toThrow();
        });

        describe("should throw", () => {
            it("if multiple properties an id attribute", () => {
                // arrange
                @EntityBlueprint({ id: "foo" })
                class Foo {
                    id_A = define(Number, { id: true });
                    id_B = define(Number, { id: true });
                }

                const catalog = new EntitySchemaCatalog();
                const resolve = () => catalog.resolve(Foo);

                // assert
                expect(resolve).toThrow();
            });
        });
    });
});

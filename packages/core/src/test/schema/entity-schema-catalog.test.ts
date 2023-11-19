import { EntityBlueprint } from "../../lib/schema/entity-blueprint";
import { define } from "../../lib/schema/entity-blueprint-property";
import { EntitySchemaCatalog } from "../../lib/schema/entity-schema-catalog";
import { MinecraftBlockBlueprint } from "../content";

describe(EntitySchemaCatalog.name, () => {
    describe(EntitySchemaCatalog.prototype.resolve.name, () => {
        it("should support composite keys", () => {
            // arrange
            const catalog = new EntitySchemaCatalog();
            const compositeKeyPath = ["namespace", "id"];

            @EntityBlueprint({ id: "foo", key: compositeKeyPath })
            class FooBlueprint {
                id = define(Number);
                namespace = define(String);
            }

            // act
            const schema = catalog.resolve(FooBlueprint);
            const key = schema.getKey();

            // assert
            expect(key.getPaths()).toEqual(compositeKeyPath);
        });

        it("should support nested composite keys", () => {
            // arrange
            const catalog = new EntitySchemaCatalog();

            // act
            const resolve = () => catalog.resolve(MinecraftBlockBlueprint);

            // assert
            expect(resolve).not.toThrow();
            const resolved = resolve();
            expect(resolved.getKey().getPaths()).toEqual(["position.x", "position.y", "position.z"]);
        });

        it("should support the unique attribute", () => {
            // arrange
            const catalog = new EntitySchemaCatalog();

            @EntityBlueprint({ id: "foo" })
            class FooBlueprint {
                id = define(Number, { id: true });
                name = define(String, { index: true, unique: true });
            }

            // act
            const schema = catalog.resolve(FooBlueprint);
            const index = schema.getIndex("name");

            // assert
            expect(index.isUnique()).toEqual(true);
        });

        it("should automatically create an index if the unique attribute is set", () => {
            // arrange
            const catalog = new EntitySchemaCatalog();

            @EntityBlueprint({ id: "foo" })
            class FooBlueprint {
                id = define(Number, { id: true });
                name = define(String, { unique: true });
            }

            // act
            const schema = catalog.resolve(FooBlueprint);
            const getIndex = () => schema.getIndex("name");

            // assert
            expect(getIndex).not.toThrow();
        });

        describe("should throw", () => {
            it("if multiple properties have the id attribute", () => {
                // arrange
                const catalog = new EntitySchemaCatalog();

                @EntityBlueprint({ id: "foo" })
                class Foo {
                    id_A = define(Number, { id: true });
                    id_B = define(Number, { id: true });
                }

                const resolve = () => catalog.resolve(Foo);

                // assert
                expect(resolve).toThrow();
            });
        });
    });
});

import { EntityMetadata } from "./entity-metadata";
import { getEntityMetadata, Property, EntityClass } from "./entity.decorator";

describe("entity-metadata", () => {
    describe("getEntityMetadata()", () => {
        @EntityClass()
        class Foo {
            @Property.Id()
            id: number = null;
        }

        @EntityClass({
            name: "Barbar"
        })
        class Bar {
            @Property.Id()
            id: number = null;
        }

        it("should throw if not found", () => {
            try {
                getEntityMetadata(Array);
                fail("expected to throw");
            } catch (error) { }
        });

        it("should accept type", () => {
            let metadata = getEntityMetadata(Foo);

            expect(metadata instanceof EntityMetadata).toBe(true);
            expect(metadata.entityType).toBe(Foo);
        });

        it("should accept entity type name", () => {
            let metadata = getEntityMetadata("Barbar");

            expect(metadata instanceof EntityMetadata).toBe(true);
            expect(metadata.entityType).toBe(Bar);
        });

        it("should accept entity type name (case insensitive check)", () => {
            let metadata = getEntityMetadata("bARbAR");

            expect(metadata instanceof EntityMetadata).toBe(true);
            expect(metadata.entityType).toBe(Bar);
        });

        it("should return different instances for different types", () => {
            expect(getEntityMetadata(Foo)).not.toBe(getEntityMetadata(Bar));
        });

        it("should throw if no primary key is defined", () => {
            try {
                @EntityClass()
                class Foo { }

                getEntityMetadata(Foo);
                fail("expected to throw");
            } catch (error) { }
        });

        it("should throw if two properties share an alias", () => {
            try {
                @EntityClass()
                class Foo {
                    @Property.Id({ dtoName: "dan" })
                    khaz: string;

                    @Property.Primitive({ dtoName: "dan" })
                    mo: string;
                }

                getEntityMetadata(Foo);
                fail("expected to throw");
            } catch (error) { }
        });

        it("should throw if an alias of a property equals the name of another", () => {
            try {
                @EntityClass()
                class Foo {
                    @Property.Id()
                    khaz: string;

                    @Property.Primitive({ dtoName: "khaz" })
                    mo: string;
                }

                getEntityMetadata(Foo);
                fail("expected to throw");
            } catch (error) { }
        });
    });

    it("should have the correct entity class name", () => {
        @EntityClass()
        class Foo { @Property.Id() id: string; }
        let fooMetadata = getEntityMetadata(Foo);

        expect(fooMetadata.name).toEqual("Foo");
    });
});

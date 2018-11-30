import { ClassMetadata, getMetadata, Property, EntityClass  } from "./class-metadata";

describe("class-metadata", () => {
    describe("getEntityMetadata()", () => {
        @EntityClass()
        class Foo {
            @Property.Id()
            id: number = null;
        }

        @EntityClass()
        class Bar {
            @Property.Id()
            id: number = null;
        }

        it("should throw if not found", () => {
            try {
                getMetadata(Array);
                fail("expected to throw");
            } catch (error) { }
        });

        it("should accept type", () => {
            let metadata = getMetadata(Foo);

            expect(metadata instanceof ClassMetadata).toBe(true);
            expect(metadata.entityType).toBe(Foo);
        });

        it("should return different instances for different types", () => {
            expect(getMetadata(Foo)).not.toBe(getMetadata(Bar));
        });

        it("should throw if no primary key is defined", () => {
            try {
                @EntityClass()
                class Foo { }

                getMetadata(Foo);
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

                getMetadata(Foo);
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

                getMetadata(Foo);
                fail("expected to throw");
            } catch (error) { }
        });
    });

    it("should have the correct entity class name", () => {
        @EntityClass()
        class Foo { @Property.Id() id: string; }
        let fooMetadata = getMetadata(Foo);

        expect(fooMetadata.entityType.name).toEqual("Foo");
    });
});

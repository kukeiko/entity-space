import { getEntityMetadata, Entity, EntityMetadata, Primitive, Navigation, Reference, Collection } from "../../src";
import { Album, AlbumReview, Artist, Song, TagType } from "../common/entities";

describe("entity-metadata", () => {
    describe("getEntityMetadata()", () => {
        it("should return null if not found", () => {
            let arrayMetadata = getEntityMetadata(Array);

            expect(arrayMetadata).toBe(null);
        });

        it("should return an EntityMetadata instance for a known type", () => {
            let albumMetadata = getEntityMetadata(Album);

            expect(albumMetadata instanceof EntityMetadata).toBe(true);
        });

        it("should return different instances for different types", () => {
            let artistMetadata = getEntityMetadata(Artist);
            let songMetadata = getEntityMetadata(Song);

            expect(artistMetadata).not.toBe(songMetadata);
        });

        it("should throw if no primary key is defined", () => {
            try {
                @Entity()
                class Foo { }

                getEntityMetadata(Foo);
                fail("expected to throw");
            } catch (error) { }
        });

        it("should throw if two properties share a name", () => {
            try {
                @Entity()
                class Foo {
                    @Entity.PrimaryKey({ name: "dan" })
                    khaz: string;

                    @Entity.Primitive({ name: "dan" })
                    mo: string;
                }

                getEntityMetadata(Foo);
                fail("expected to throw");
            } catch (error) { }
        });

        it("should throw if two properties share an alias", () => {
            try {
                @Entity()
                class Foo {
                    @Entity.PrimaryKey({ alias: "dan" })
                    khaz: string;

                    @Entity.Primitive({ alias: "dan" })
                    mo: string;
                }

                getEntityMetadata(Foo);
                fail("expected to throw");
            } catch (error) { }
        });

        it("should throw if an alias of a property equals the name of another", () => {
            try {
                @Entity()
                class Foo {
                    @Entity.PrimaryKey()
                    khaz: string;

                    @Entity.Primitive({ alias: "khaz" })
                    mo: string;
                }

                getEntityMetadata(Foo);
                fail("expected to throw");
            } catch (error) { }
        });
    });

    it("should have the correct entity class name", () => {
        let albumMetadata = getEntityMetadata(Album);
        let tagTypeMetadata = getEntityMetadata(TagType);

        expect(albumMetadata.name).toEqual("Album");
        expect(tagTypeMetadata.name).toEqual("TagType");
    });

    describe("fromCached()", () => {
        it("should not try to set a computed property", () => {
            let metadata = getEntityMetadata(AlbumReview);

            try {
                metadata.fromCached(<AlbumReview>{
                    reviewExternalId: "abc@foo"
                });
            } catch (error) {
                fail("expected not to throw");
            }
        });

        it("should use custom creator function", () => {
            let didUse = false;

            @Entity({
                createEntity: (data: any) => {
                    didUse = true;
                    return new Foo();
                }
            })
            class Foo {
                @Entity.PrimaryKey()
                id: number;
            }

            let metadata = getEntityMetadata(Foo);

            metadata.fromCached({});
            expect(didUse).toBe(true);
        });
    });

    describe("getProperty()", () => {
        let songMetadata = getEntityMetadata(Song);

        it("should return null if not found", () => {
            expect(songMetadata.getProperty("iDontExist")).toBe(null);
        });

        it("should ignore case", () => {
            expect(songMetadata.getProperty("NAME") instanceof Primitive).toBe(true);
        });

        it("should return a primitive, navigation, reference and collection", () => {
            expect(songMetadata.getProperty("name") instanceof Primitive).toBe(true, "primitive");
            expect(songMetadata.getProperty("album") instanceof Navigation).toBe(true, "navigation");
            expect(songMetadata.getProperty("album") instanceof Reference).toBe(true, "reference");
            expect(songMetadata.getProperty("tags") instanceof Collection).toBe(true, "collection");
        });
    });

    describe("getPrimitive()", () => {
        let songMetadata = getEntityMetadata(Song);

        it("should return null if not found", () => {
            expect(songMetadata.getPrimitive("iDontExist")).toBe(null);
        });

        it("should ignore case", () => {
            expect(songMetadata.getPrimitive("NAME") instanceof Primitive).toBe(true);
        });

        it("should return a primitive", () => {
            expect(songMetadata.getPrimitive("name") instanceof Primitive).toBe(true);
        });

        it("should not return a reference or collection", () => {
            expect(songMetadata.getPrimitive("album")).toBe(null, "reference");
            expect(songMetadata.getPrimitive("tags")).toBe(null, "collection");
        });
    });

    describe("getNavigation()", () => {
        let songMetadata = getEntityMetadata(Song);

        it("should return null if not found", () => {
            expect(songMetadata.getNavigation("iDontExist")).toBe(null);
        });

        it("should ignore case", () => {
            expect(songMetadata.getNavigation("ALBUM") instanceof Navigation).toBe(true);
        });

        it("should not return a primitive", () => {
            expect(songMetadata.getNavigation("name")).toBe(null);
        });

        it("should return a reference and collection", () => {
            expect(songMetadata.getNavigation("album") instanceof Reference).toBe(true, "reference");
            expect(songMetadata.getNavigation("tags") instanceof Collection).toBe(true, "collection");
        });
    });

    describe("getReference()", () => {
        let songMetadata = getEntityMetadata(Song);

        it("should return null if not found", () => {
            expect(songMetadata.getReference("iDontExist")).toBe(null);
        });

        it("should ignore case", () => {
            expect(songMetadata.getReference("ALBUM") instanceof Reference).toBe(true);
        });

        it("should return a reference", () => {
            expect(songMetadata.getReference("album") instanceof Reference).toBe(true);
        });

        it("should not return a primitive or collection", () => {
            expect(songMetadata.getReference("name")).toBe(null, "primitive");
            expect(songMetadata.getReference("tags")).toBe(null, "collection");
        });
    });

    describe("getCollection()", () => {
        let songMetadata = getEntityMetadata(Song);

        it("should return null if not found", () => {
            expect(songMetadata.getCollection("iDontExist")).toBe(null);
        });

        it("should ignore case", () => {
            expect(songMetadata.getCollection("TAGS") instanceof Collection).toBe(true);
        });

        it("should return a collection", () => {
            expect(songMetadata.getCollection("tags") instanceof Collection).toBe(true);
        });

        it("should not return a primitive or reference", () => {
            expect(songMetadata.getCollection("name")).toBe(null, "primitive");
            expect(songMetadata.getCollection("album")).toBe(null, "reference");
        });
    });

    describe("getVirtuals()", () => {
        it("should return a collection marked as virtual", () => {
            let metadata = getEntityMetadata(Album);

            let virtuals = metadata.getVirtuals();

            expect(virtuals.find(v => v.name == "reviews")).toBeDefined();
        });
    });
});

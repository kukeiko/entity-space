import { Query } from "./query";
import { Expansion } from "./expansion";
import { getEntityMetadata, EntityClass, Property } from "../metadata";
import { Artist, Album } from "../../test/facade";

describe("query", () => {
    it("expansion string should be sorted by name", () => {
        let q = Query.All({
            entity: Album,
            expand: `songs,artist,tags,reviews`
        });

        expect(q.expansion).toEqual("artist,reviews,songs,tags");
    });

    it("expansions should be sorted by name", () => {
        let q = Query.All({
            entity: Album,
            expand: `songs,artist,tags,reviews`
        });

        expect(q.expansions.map(exp => exp.toString()).join(",")).toEqual("artist,reviews,songs,tags");
    });

    // todo: more combinations are possiberu
    // todo: byKey & byIndex combinations are missing
    describe("isSuperset()/isSubsetOf()", () => {
        it("Artist(64,3,128) should be superset of Artist(3)", () => {
            let a = Query.ByIds({
                ids: [64, 3, 128],
                entity: Artist
            });

            let b = Query.ByIds({
                ids: [3],
                entity: Artist
            });

            expect(a.isSupersetOf(b)).toEqual(true);
            expect(b.isSupersetOf(a)).toEqual(false);
            expect(a.isSubsetOf(b)).toEqual(false);
            expect(b.isSubsetOf(a)).toEqual(true);
        });

        it("Artist(64,3,128) should be superset of Artist(3,64)", () => {
            let a = Query.ByIds({
                ids: [64, 3, 128],
                entity: Artist
            });

            let b = Query.ByIds({
                ids: [3, 64],
                entity: Artist
            });

            expect(a.isSupersetOf(b)).toEqual(true);
            expect(b.isSupersetOf(a)).toEqual(false);
            expect(a.isSubsetOf(b)).toEqual(false);
            expect(b.isSubsetOf(a)).toEqual(true);
        });

        it("all:artist/albums/{songs,tags} should be superset of all:artist", () => {
            let a = Query.All({
                entity: Artist,
                expand: Expansion.parse(Artist, "albums/{songs,tags}")
            });

            let b = Query.All({
                entity: Artist
            });

            expect(a.isSupersetOf(b)).toEqual(true);
            expect(b.isSupersetOf(a)).toEqual(false);
            expect(a.isSubsetOf(b)).toEqual(false);
            expect(b.isSubsetOf(a)).toEqual(true);
        });

        it("all:artist/albums/{songs,tags} should be superset of all:artist/albums", () => {
            let a = Query.All({
                entity: Artist,
                expand: Expansion.parse(Artist, "albums/{songs,tags}")
            });

            let b = Query.All({
                entity: Artist,
                expand: Expansion.parse(Artist, "albums")
            });

            expect(a.isSupersetOf(b)).toEqual(true);
            expect(b.isSupersetOf(a)).toEqual(false);
            expect(a.isSubsetOf(b)).toEqual(false);
            expect(b.isSubsetOf(a)).toEqual(true);
        });

        it("all:artist/albums/{songs,tags} should be superset of all:artist/albums/songs", () => {
            let a = Query.All({
                entity: Artist,
                expand: Expansion.parse(Artist, "albums/{songs,tags}")
            });

            let b = Query.All({
                entity: Artist,
                expand: Expansion.parse(Artist, "albums/songs")
            });

            expect(a.isSupersetOf(b)).toEqual(true);
            expect(b.isSupersetOf(a)).toEqual(false);
            expect(a.isSubsetOf(b)).toEqual(false);
            expect(b.isSubsetOf(a)).toEqual(true);
        });

        it("all:artist/albums/{songs,tags} should be superset of all:artist/albums/{songs,tags}", () => {
            let a = Query.All({
                entity: Artist,
                expand: Expansion.parse(Artist, "albums/{songs,tags}")
            });

            let b = Query.All({
                entity: Artist,
                expand: Expansion.parse(Artist, "albums/{songs,tags}")
            });

            expect(a.isSupersetOf(b)).toEqual(true);
            expect(b.isSupersetOf(a)).toEqual(true);
            expect(a.isSubsetOf(b)).toEqual(true);
            expect(b.isSubsetOf(a)).toEqual(true);
        });

        it("all:artist/albums/{songs,tags} should be superset of all:artist/albums/{tags,songs}", () => {
            let a = Query.All({
                entity: Artist,
                expand: Expansion.parse(Artist, "albums/{songs,tags}")
            });

            let b = Query.All({
                entity: Artist,
                expand: Expansion.parse(Artist, "albums/{songs,tags}")
            });

            expect(a.isSupersetOf(b)).toEqual(true);
            expect(b.isSupersetOf(a)).toEqual(true);
            expect(a.isSubsetOf(b)).toEqual(true);
            expect(b.isSubsetOf(a)).toEqual(true);
        });

        it("all:artist/albums/{songs,tags} should be superset of byKey:artist/albums/{songs,tags}", () => {
            let a = Query.All({
                entity: Artist,
                expand: Expansion.parse(Artist, "albums/{songs,tags}")
            });

            let b = Query.ByIds({
                ids: [1],
                entity: Artist,
                expand: Expansion.parse(Artist, "albums/{songs,tags}")
            });

            expect(a.isSupersetOf(b)).toEqual(true);
            expect(b.isSupersetOf(a)).toEqual(false);
            expect(a.isSubsetOf(b)).toEqual(false);
            expect(b.isSubsetOf(a)).toEqual(true);
        });
    });

    describe("toString()", () => {
        it("all: Artist(all)/albums/{songs,tags}", () => {
            let q = Query.All({
                entity: Artist,
                expand: Expansion.parse(Artist, "albums/{songs,tags}")
            });

            expect(q.toString()).toEqual("Artist(all)/albums/{songs,tags}");
        });

        it("byId: Artist(64)/albums/{songs,tags}", () => {
            let q = Query.ByIds({
                ids: [64],
                entity: Artist,
                expand: Expansion.parse(Artist, "albums/{songs,tags}")
            });

            expect(q.toString()).toEqual("Artist(64)/albums/{songs,tags}");
        });

        it("byIds: Artist(1337,23,42,64)/albums/{songs,tags}", () => {
            let q = Query.ByIds({
                ids: [64, 1337, 42, 23],
                entity: Artist,
                expand: Expansion.parse(Artist, "albums/{songs,tags}")
            });

            expect(q.toString()).toEqual("Artist(1337,23,42,64)/albums/{songs,tags}");
        });

        it("byIndexes: Artist(khaz:64,mo:dan)/albums/{songs,tags}", () => {
            let q = Query.ByIndexes({
                criteria: { khaz: 64, mo: "dan" },
                entity: Artist,
                expand: Expansion.parse(Artist, "albums/{songs,tags}")
            });

            expect(q.toString()).toEqual("Artist(khaz:64,mo:dan)/albums/{songs,tags}");
        });
    });

    describe("extract()", () => {
        it("should extract 1st level expansion", () => {
            // arrange
            let q = Query.All({
                entity: Artist,
                expand: Expansion.parse(Artist, "albums/{songs/album,tags}")
            });

            let albumsProp = getEntityMetadata(Artist).getNavigation("albums");

            // act
            let [withoutAlbumsQuery, extracted] = q.extract(x => x.property == albumsProp);

            // assert
            expect(q.toString()).toEqual("Artist(all)/albums/{songs/album,tags}");
            expect(withoutAlbumsQuery.toString()).toEqual("Artist(all)");
            expect(extracted.length).toEqual(1);
            expect(extracted[0].path).toEqual(null);
            expect(extracted[0].extracted.property).toEqual(albumsProp);
            expect(extracted[0].extracted.toString()).toEqual("albums/{songs/album,tags}");
        });

        it("should extract 2nd level expansions", () => {
            // arrange
            let q = Query.All({
                entity: Artist,
                expand: Expansion.parse(Artist, "albums/{songs/album,tags}")
            });

            let songsProp = getEntityMetadata(Album).getNavigation("songs");
            let tagsProp = getEntityMetadata(Album).getNavigation("tags");

            // act
            let [withoutSongsQuery, songExtracted] = q.extract(x => x.property == songsProp);

            // assert
            expect(q.toString()).toEqual("Artist(all)/albums/{songs/album,tags}");
            expect(q.expansions.length).toEqual(1);
            expect(q.expansions[0].expansions.length).toEqual(2);
            expect(withoutSongsQuery.toString()).toEqual("Artist(all)/albums/tags");
            expect(songExtracted.length).toEqual(1);
            expect(songExtracted[0].extracted.property).toEqual(songsProp);
            expect(songExtracted[0].extracted.toString()).toEqual("songs/album");
            expect(songExtracted[0].path.toString()).toEqual("albums");

            // act
            let [withoutTagsQuery, tagsExtracted] = q.extract(x => x.property == tagsProp);

            // assert
            expect(q.toString()).toEqual("Artist(all)/albums/{songs/album,tags}");
            expect(q.expansions.length).toEqual(1);
            expect(q.expansions[0].expansions.length).toEqual(2);
            expect(withoutTagsQuery.toString()).toEqual("Artist(all)/albums/songs/album");
            expect(tagsExtracted.length).toEqual(1);
            expect(tagsExtracted[0].extracted.property).toEqual(tagsProp);
            expect(tagsExtracted[0].path.toString()).toEqual("albums");

            // act
            let [withoutSongsAndTagsQuery, songsAndTagsExtracted] = q.extract(x => [songsProp, tagsProp].includes(x.property));

            // assert
            expect(q.toString()).toEqual("Artist(all)/albums/{songs/album,tags}");
            expect(q.expansions.length).toEqual(1);
            expect(q.expansions[0].expansions.length).toEqual(2);
            expect(withoutSongsAndTagsQuery.toString()).toEqual("Artist(all)/albums");
            expect(songsAndTagsExtracted.length).toEqual(2);
            expect(songsAndTagsExtracted[0].extracted.property).toEqual(songsProp);
            expect(songsAndTagsExtracted[0].extracted.toString()).toEqual("songs/album");
            expect(songsAndTagsExtracted[1].extracted.property).toEqual(tagsProp);
            expect(songsAndTagsExtracted[1].extracted.toString()).toEqual("tags");
            expect(songsAndTagsExtracted[0].path.toString()).toEqual("albums");
            expect(songsAndTagsExtracted[1].path.toString()).toEqual("albums");
        });
    });

    it("should have correct number of expansions", () => {
        let q = Query.All({
            entity: Artist,
            expand: `albums/{tags/tag,songs/tags/tag}`
        });

        expect(q.numExpansions).toEqual(6);
    });

    describe("reduce()", () => {
        @EntityClass() class Baz {
            @Property.Id() id: number;
        }

        @EntityClass() class Bar {
            @Property.Id() id: number;
            @Property.Key() bazId: number;
            @Property.Reference({ key: "bazId", other: () => Baz }) baz: Baz;
        }

        @EntityClass() class Foo {
            @Property.Id() id: number;
            @Property.Key() fooId: number;
            @Property.Reference({ key: "fooId", other: () => Foo }) foo: Foo;
            @Property.Key() barId: number;
            @Property.Reference({ key: "barId", other: () => Bar }) bar: Bar;
        }

        it("should return null if reducing itself", () => {
            let q = Query.All({
                entity: Foo,
                expand: "foo",
                filter: { id: { op: "<", type: "number", value: 3, step: 1 } }
            });

            expect(q.reduce(q)).toBeNull();
        });

        it("should return null if reducing equivalent", () => {
            let a = Query.All({
                entity: Foo,
                expand: "foo",
                filter: { id: { op: "<", type: "number", value: 3, step: 1 } }
            });

            let b = Query.All({
                entity: Foo,
                expand: "foo",
                filter: { id: { op: "<", type: "number", value: 3, step: 1 } }
            });

            expect(a.reduce(b)).toBeNull();
        });

        it("should return a query with a reduced expansion", () => {
            let a = Query.All({
                entity: Foo,
                expand: "foo"
            });

            let b = Query.All({
                entity: Foo,
                expand: "bar,foo"
            });

            let reduced = a.reduce(b);

            expect(reduced).not.toBeNull();
            expect(reduced).toEqual(Query.All({
                entity: Foo,
                expand: "bar"
            }));
        });

        it("should return a query with a reduced filter", () => {
            let lessThan3 = Query.All({
                entity: Foo,
                filter: { id: { op: "<", type: "number", value: 3, step: 1 } }
            });

            let lessThan7 = Query.All({
                entity: Foo,
                filter: { id: { op: "<", type: "number", value: 7, step: 1 } }
            });

            let reduced = lessThan3.reduce(lessThan7);

            expect(reduced).not.toBeNull();
            expect(reduced.filter.criteria.id).toEqual({ op: "from-to", type: "number", range: [3, 6], step: 1 });
        });

        it("should not reduce the filter if the expansions are not a superset", () => {
            {
                let a = Query.All({
                    entity: Foo,
                    expand: "bar/baz",
                    filter: { id: { op: "<", type: "number", value: 3, step: 1 } }
                });

                let b = Query.All({
                    entity: Foo,
                    expand: "bar",
                    filter: { id: { op: "<", type: "number", value: 7, step: 1 } }
                });

                let reduced = a.reduce(b);

                expect(reduced).toEqual(Query.All({
                    entity: Foo,
                    expand: "bar",
                    filter: { id: { op: "from-to", type: "number", range: [3, 6], step: 1 } }
                }));
            }

            {
                let a = Query.All({
                    entity: Foo,
                    expand: "bar",
                    filter: { id: { op: "<", type: "number", value: 3, step: 1 } }
                });

                let b = Query.All({
                    entity: Foo,
                    expand: "bar/baz",
                    filter: { id: { op: "<", type: "number", value: 7, step: 1 } }
                });

                let reduced = a.reduce(b);

                expect(reduced).toBe(b);
            }
        });

        it("should only reduce identity if the filter is completely reduced", () => {
            {
                let a = Query.ByIds({
                    entity: Foo,
                    filter: { id: { op: "<", type: "number", value: 2, step: 1 } },
                    ids: [1, 2]
                });

                let b = Query.ByIds({
                    entity: Foo,
                    filter: { id: { op: "<", type: "number", value: 3, step: 1 } },
                    ids: [2, 3]
                });

                expect(a.reduce(b)).toBe(b);
            }
            {
                let a = Query.ByIds({
                    entity: Foo,
                    filter: { id: { op: "<", type: "number", value: 4, step: 1 } },
                    ids: [1, 2]
                });

                let b = Query.ByIds({
                    entity: Foo,
                    filter: { id: { op: "<", type: "number", value: 3, step: 1 } },
                    ids: [2, 3]
                });

                expect(a.reduce(b)).toEqual(Query.ByIds({
                    entity: Foo,
                    filter: { id: { op: "<", type: "number", value: 3, step: 1 } },
                    ids: [3]
                }));
            }
        });
    });
});

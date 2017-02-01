import { getEntityMetadata, Query, Expansion } from "../../src/";
import { Artist, Album } from "../common";

describe("query", () => {
    it("expansion string should be sorted by name", () => {
        let q = new Query.All({
            entityType: Album,
            expansions: `songs,artist,tags,reviews`
        });

        expect(q.expansion).toEqual("artist,reviews,songs,tags");
    });

    it("expansions should be sorted by name", () => {
        let q = new Query.All({
            entityType: Album,
            expansions: `songs,artist,tags,reviews`
        });

        expect(q.expansions.map(exp => exp.toString()).join(",")).toEqual("artist,reviews,songs,tags");
    });

    describe("parse()", () => {
        it("should parse Artist into Query.All", () => {
            let expected = new Query.All({
                entityType: Artist
            });

            let q = Query.parse("Artist");

            expect(q).toEqual(expected);
        });

        it("should parse Artist(64) into Query.ByKey", () => {
            let expected = new Query.ByKey({
                entityType: Artist,
                key: 64
            });

            let q = Query.parse("Artist(64)");

            expect(q).toEqual(expected);
        });

        it("should parse Artist([64, 7, 1337]) into Query.ByKeys", () => {
            let expected = new Query.ByKeys({
                entityType: Artist,
                keys: [64, 7, 1337]
            });

            let q = Query.parse("Artist([64, 7, 1337])");

            expect(q).toEqual(expected);
        });

        it("should parse Artist({\"name\": \"fo\\\"o\"}) into Query.ByIndex", () => {
            let expected = new Query.ByIndex({
                entityType: Artist,
                index: "name",
                value: "fo\"o"
            });

            let q = Query.parse("Artist({\"name\": \"fo\\\"o\"})");

            expect(q).toEqual(expected);
        });

        it("should parse Artist({\"name\": \"fo\\\"o\", \"age\": 27}) into Query.ByIndexes", () => {
            let expected = new Query.ByIndexes({
                entityType: Artist,
                indexes: {
                    name: "fo\"o",
                    age: 27
                }
            });

            let q = Query.parse("Artist({\"name\": \"fo\\\"o\", \"age\": 27})");

            expect(q).toEqual(expected);
        });
    });

    // todo: more combinations are possiberu
    // todo: byKey & byIndex combinations are missing
    describe("isSuperset()/isSubsetOf()", () => {
        it("Artist(64,3,128) should be superset of Artist(3)", () => {
            let a = new Query.ByKeys({
                entityType: Artist,
                keys: [64, 3, 128]
            });

            let b = new Query.ByKey({
                entityType: Artist,
                key: 3
            });

            expect(a.isSuperSetOf(b)).toEqual(true);
            expect(b.isSuperSetOf(a)).toEqual(false);
            expect(a.isSubsetOf(b)).toEqual(false);
            expect(b.isSubsetOf(a)).toEqual(true);
        });

        it("Artist(64,3,128) should be superset of Artist(3,64)", () => {
            let a = new Query.ByKeys({
                entityType: Artist,
                keys: [64, 3, 128]
            });

            let b = new Query.ByKeys({
                entityType: Artist,
                keys: [3, 64]
            });

            expect(a.isSuperSetOf(b)).toEqual(true);
            expect(b.isSuperSetOf(a)).toEqual(false);
            expect(a.isSubsetOf(b)).toEqual(false);
            expect(b.isSubsetOf(a)).toEqual(true);
        });

        it("all:artist/albums/{songs,tags} should be superset of all:artist", () => {
            let a = new Query.All({
                entityType: Artist,
                expansions: Expansion.parse(Artist, "albums/{songs,tags}")
            });

            let b = new Query.All({
                entityType: Artist
            });

            expect(a.isSuperSetOf(b)).toEqual(true);
            expect(b.isSuperSetOf(a)).toEqual(false);
            expect(a.isSubsetOf(b)).toEqual(false);
            expect(b.isSubsetOf(a)).toEqual(true);
        });

        it("all:artist/albums/{songs,tags} should be superset of all:artist/albums", () => {
            let a = new Query.All({
                entityType: Artist,
                expansions: Expansion.parse(Artist, "albums/{songs,tags}")
            });

            let b = new Query.All({
                entityType: Artist,
                expansions: Expansion.parse(Artist, "albums")
            });

            expect(a.isSuperSetOf(b)).toEqual(true);
            expect(b.isSuperSetOf(a)).toEqual(false);
            expect(a.isSubsetOf(b)).toEqual(false);
            expect(b.isSubsetOf(a)).toEqual(true);
        });

        it("all:artist/albums/{songs,tags} should be superset of all:artist/albums/songs", () => {
            let a = new Query.All({
                entityType: Artist,
                expansions: Expansion.parse(Artist, "albums/{songs,tags}")
            });

            let b = new Query.All({
                entityType: Artist,
                expansions: Expansion.parse(Artist, "albums/songs")
            });

            expect(a.isSuperSetOf(b)).toEqual(true);
            expect(b.isSuperSetOf(a)).toEqual(false);
            expect(a.isSubsetOf(b)).toEqual(false);
            expect(b.isSubsetOf(a)).toEqual(true);
        });

        it("all:artist/albums/{songs,tags} should be superset of all:artist/albums/{songs,tags}", () => {
            let a = new Query.All({
                entityType: Artist,
                expansions: Expansion.parse(Artist, "albums/{songs,tags}")
            });

            let b = new Query.All({
                entityType: Artist,
                expansions: Expansion.parse(Artist, "albums/{songs,tags}")
            });

            expect(a.isSuperSetOf(b)).toEqual(true);
            expect(b.isSuperSetOf(a)).toEqual(true);
            expect(a.isSubsetOf(b)).toEqual(true);
            expect(b.isSubsetOf(a)).toEqual(true);
        });

        it("all:artist/albums/{songs,tags} should be superset of all:artist/albums/{tags,songs}", () => {
            let a = new Query.All({
                entityType: Artist,
                expansions: Expansion.parse(Artist, "albums/{songs,tags}")
            });

            let b = new Query.All({
                entityType: Artist,
                expansions: Expansion.parse(Artist, "albums/{songs,tags}")
            });

            expect(a.isSuperSetOf(b)).toEqual(true);
            expect(b.isSuperSetOf(a)).toEqual(true);
            expect(a.isSubsetOf(b)).toEqual(true);
            expect(b.isSubsetOf(a)).toEqual(true);
        });

        it("all:artist/albums/{songs,tags} should be superset of byKey:artist/albums/{songs,tags}", () => {
            let a = new Query.All({
                entityType: Artist,
                expansions: Expansion.parse(Artist, "albums/{songs,tags}")
            });

            let b = new Query.ByKey({
                key: 1,
                entityType: Artist,
                expansions: Expansion.parse(Artist, "albums/{songs,tags}")
            });

            expect(a.isSuperSetOf(b)).toEqual(true);
            expect(b.isSuperSetOf(a)).toEqual(false);
            expect(a.isSubsetOf(b)).toEqual(false);
            expect(b.isSubsetOf(a)).toEqual(true);
        });

        it("all:albums/{songs,tags} should be superset of byIndex:albums/{songs,tags}", () => {
            let a = new Query.All({
                entityType: Artist,
                expansions: Expansion.parse(Album, "songs,tags")
            });

            let b = new Query.ByIndex({
                index: "artistId",
                value: 1,
                entityType: Artist,
                expansions: Expansion.parse(Album, "songs,tags")
            });

            expect(a.isSuperSetOf(b)).toEqual(true);
            expect(b.isSuperSetOf(a)).toEqual(false);
            expect(a.isSubsetOf(b)).toEqual(false);
            expect(b.isSubsetOf(a)).toEqual(true);
        });
    });

    describe("toString()", () => {
        it("all: Artist/albums/{songs,tags}", () => {
            let q = new Query.All({
                entityType: Artist,
                expansions: Expansion.parse(Artist, "albums/{songs,tags}")
            });

            expect(q.toString()).toEqual("Artist/albums/{songs,tags}");
        });

        it("byKey: Artist(64)/albums/{songs,tags}", () => {
            let q = new Query.ByKey({
                key: 64,
                entityType: Artist,
                expansions: Expansion.parse(Artist, "albums/{songs,tags}")
            });

            expect(q.toString()).toEqual("Artist(64)/albums/{songs,tags}");
        });

        it("byKeys: Artist(64,1337,42,23)/albums/{songs,tags}", () => {
            let q = new Query.ByKeys({
                keys: [64, 1337, 42, 23],
                entityType: Artist,
                expansions: Expansion.parse(Artist, "albums/{songs,tags}")
            });

            expect(q.toString()).toEqual("Artist(64,1337,42,23)/albums/{songs,tags}");
        });

        it("byIndex: Artist(theIndex:theValue)/albums/{songs,tags}", () => {
            let q = new Query.ByIndex({
                index: "theIndex",
                value: "theValue",
                entityType: Artist,
                expansions: Expansion.parse(Artist, "albums/{songs,tags}")
            });

            expect(q.toString()).toEqual("Artist(theIndex:theValue)/albums/{songs,tags}");
        });

        it("byIndexes: Artist(khaz:64,mo:dan)/albums/{songs,tags}", () => {
            let q = new Query.ByIndexes({
                indexes: {
                    khaz: 64,
                    mo: "dan"
                },
                entityType: Artist,
                expansions: Expansion.parse(Artist, "albums/{songs,tags}")
            });

            expect(q.toString()).toEqual("Artist(khaz:64,mo:dan)/albums/{songs,tags}");
        });
    });

    describe("extract()", () => {
        it("should extract 1st level expansion", () => {
            // arrange
            let q = new Query.All({
                entityType: Artist,
                expansions: Expansion.parse(Artist, "albums/{songs/album,tags}")
            });

            let albumsProp = getEntityMetadata(Artist).getNavigation("albums");

            // act
            let [withoutAlbumsQuery, extracted] = q.extract(x => x.property == albumsProp);

            // assert
            expect(q.toString()).toEqual("Artist/albums/{songs/album,tags}");
            expect(withoutAlbumsQuery.toString()).toEqual("Artist");
            expect(extracted.length).toEqual(1);
            expect(extracted[0].path).toEqual(null);
            expect(extracted[0].extracted.property).toEqual(albumsProp);
            expect(extracted[0].extracted.toString()).toEqual("albums/{songs/album,tags}");
        });

        it("should extract 2nd level expansions", () => {
            // arrange
            let q = new Query.All({
                entityType: Artist,
                expansions: Expansion.parse(Artist, "albums/{songs/album,tags}")
            });

            let songsProp = getEntityMetadata(Album).getNavigation("songs");
            let tagsProp = getEntityMetadata(Album).getNavigation("tags");

            // act
            let [withoutSongsQuery, songExtracted] = q.extract(x => x.property == songsProp);

            // assert
            expect(q.toString()).toEqual("Artist/albums/{songs/album,tags}");
            expect(q.expansions.length).toEqual(1);
            expect(q.expansions[0].expansions.length).toEqual(2);
            expect(withoutSongsQuery.toString()).toEqual("Artist/albums/tags");
            expect(songExtracted.length).toEqual(1);
            expect(songExtracted[0].extracted.property).toEqual(songsProp);
            expect(songExtracted[0].extracted.toString()).toEqual("songs/album");
            expect(songExtracted[0].path.toString()).toEqual("albums");

            // act
            let [withoutTagsQuery, tagsExtracted] = q.extract(x => x.property == tagsProp);

            // assert
            expect(q.toString()).toEqual("Artist/albums/{songs/album,tags}");
            expect(q.expansions.length).toEqual(1);
            expect(q.expansions[0].expansions.length).toEqual(2);
            expect(withoutTagsQuery.toString()).toEqual("Artist/albums/songs/album");
            expect(tagsExtracted.length).toEqual(1);
            expect(tagsExtracted[0].extracted.property).toEqual(tagsProp);
            expect(tagsExtracted[0].path.toString()).toEqual("albums");

            // act
            let [withoutSongsAndTagsQuery, songsAndTagsExtracted] = q.extract(x => [songsProp, tagsProp].includes(x.property));

            // assert
            expect(q.toString()).toEqual("Artist/albums/{songs/album,tags}");
            expect(q.expansions.length).toEqual(1);
            expect(q.expansions[0].expansions.length).toEqual(2);
            expect(withoutSongsAndTagsQuery.toString()).toEqual("Artist/albums");
            expect(songsAndTagsExtracted.length).toEqual(2);
            expect(songsAndTagsExtracted[0].extracted.property).toEqual(songsProp);
            expect(songsAndTagsExtracted[0].extracted.toString()).toEqual("songs/album");
            expect(songsAndTagsExtracted[1].extracted.property).toEqual(tagsProp);
            expect(songsAndTagsExtracted[1].extracted.toString()).toEqual("tags");
            expect(songsAndTagsExtracted[0].path.toString()).toEqual("albums");
            expect(songsAndTagsExtracted[1].path.toString()).toEqual("albums");
        });
    });
});

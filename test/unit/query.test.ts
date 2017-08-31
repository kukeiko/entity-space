import { getEntityMetadata, Query, Expansion } from "../../src/";
import { Artist, Album } from "../common";

describe("query", () => {
    it("expansion string should be sorted by name", () => {
        let q = Query.All({
            entityType: Album,
            expand: `songs,artist,tags,reviews`
        });

        expect(q.expansion).toEqual("artist,reviews,songs,tags");
    });

    it("expansions should be sorted by name", () => {
        let q = Query.All({
            entityType: Album,
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
                entityType: Artist
            });

            let b = Query.ByIds({
                ids: [3],
                entityType: Artist
            });

            expect(a.isSupersetOf(b)).toEqual(true);
            expect(b.isSupersetOf(a)).toEqual(false);
            expect(a.isSubsetOf(b)).toEqual(false);
            expect(b.isSubsetOf(a)).toEqual(true);
        });

        it("Artist(64,3,128) should be superset of Artist(3,64)", () => {
            let a = Query.ByIds({
                ids: [64, 3, 128],
                entityType: Artist
            });

            let b = Query.ByIds({
                ids: [3, 64],
                entityType: Artist
            });

            expect(a.isSupersetOf(b)).toEqual(true);
            expect(b.isSupersetOf(a)).toEqual(false);
            expect(a.isSubsetOf(b)).toEqual(false);
            expect(b.isSubsetOf(a)).toEqual(true);
        });

        it("all:artist/albums/{songs,tags} should be superset of all:artist", () => {
            let a = Query.All({
                entityType: Artist,
                expand: Expansion.parse(Artist, "albums/{songs,tags}")
            });

            let b = Query.All({
                entityType: Artist
            });

            expect(a.isSupersetOf(b)).toEqual(true);
            expect(b.isSupersetOf(a)).toEqual(false);
            expect(a.isSubsetOf(b)).toEqual(false);
            expect(b.isSubsetOf(a)).toEqual(true);
        });

        it("all:artist/albums/{songs,tags} should be superset of all:artist/albums", () => {
            let a = Query.All({
                entityType: Artist,
                expand: Expansion.parse(Artist, "albums/{songs,tags}")
            });

            let b = Query.All({
                entityType: Artist,
                expand: Expansion.parse(Artist, "albums")
            });

            expect(a.isSupersetOf(b)).toEqual(true);
            expect(b.isSupersetOf(a)).toEqual(false);
            expect(a.isSubsetOf(b)).toEqual(false);
            expect(b.isSubsetOf(a)).toEqual(true);
        });

        it("all:artist/albums/{songs,tags} should be superset of all:artist/albums/songs", () => {
            let a = Query.All({
                entityType: Artist,
                expand: Expansion.parse(Artist, "albums/{songs,tags}")
            });

            let b = Query.All({
                entityType: Artist,
                expand: Expansion.parse(Artist, "albums/songs")
            });

            expect(a.isSupersetOf(b)).toEqual(true);
            expect(b.isSupersetOf(a)).toEqual(false);
            expect(a.isSubsetOf(b)).toEqual(false);
            expect(b.isSubsetOf(a)).toEqual(true);
        });

        it("all:artist/albums/{songs,tags} should be superset of all:artist/albums/{songs,tags}", () => {
            let a = Query.All({
                entityType: Artist,
                expand: Expansion.parse(Artist, "albums/{songs,tags}")
            });

            let b = Query.All({
                entityType: Artist,
                expand: Expansion.parse(Artist, "albums/{songs,tags}")
            });

            expect(a.isSupersetOf(b)).toEqual(true);
            expect(b.isSupersetOf(a)).toEqual(true);
            expect(a.isSubsetOf(b)).toEqual(true);
            expect(b.isSubsetOf(a)).toEqual(true);
        });

        it("all:artist/albums/{songs,tags} should be superset of all:artist/albums/{tags,songs}", () => {
            let a = Query.All({
                entityType: Artist,
                expand: Expansion.parse(Artist, "albums/{songs,tags}")
            });

            let b = Query.All({
                entityType: Artist,
                expand: Expansion.parse(Artist, "albums/{songs,tags}")
            });

            expect(a.isSupersetOf(b)).toEqual(true);
            expect(b.isSupersetOf(a)).toEqual(true);
            expect(a.isSubsetOf(b)).toEqual(true);
            expect(b.isSubsetOf(a)).toEqual(true);
        });

        it("all:artist/albums/{songs,tags} should be superset of byKey:artist/albums/{songs,tags}", () => {
            let a = Query.All({
                entityType: Artist,
                expand: Expansion.parse(Artist, "albums/{songs,tags}")
            });

            let b = Query.ByIds({
                ids: [1],
                entityType: Artist,
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
                entityType: Artist,
                expand: Expansion.parse(Artist, "albums/{songs,tags}")
            });

            expect(q.toString()).toEqual("Artist(all)/albums/{songs,tags}");
        });

        it("byId: Artist(64)/albums/{songs,tags}", () => {
            let q = Query.ByIds({
                ids: [64],
                entityType: Artist,
                expand: Expansion.parse(Artist, "albums/{songs,tags}")
            });

            expect(q.toString()).toEqual("Artist(64)/albums/{songs,tags}");
        });

        it("byIds: Artist(1337,23,42,64)/albums/{songs,tags}", () => {
            let q = Query.ByIds({
                ids: [64, 1337, 42, 23],
                entityType: Artist,
                expand: Expansion.parse(Artist, "albums/{songs,tags}")
            });

            expect(q.toString()).toEqual("Artist(1337,23,42,64)/albums/{songs,tags}");
        });

        it("byIndexes: Artist(khaz:64,mo:dan)/albums/{songs,tags}", () => {
            let q = Query.ByIndexes({
                indexes: { khaz: 64, mo: "dan" },
                entityType: Artist,
                expand: Expansion.parse(Artist, "albums/{songs,tags}")
            });

            expect(q.toString()).toEqual("Artist(khaz:64,mo:dan)/albums/{songs,tags}");
        });
    });

    describe("extract()", () => {
        it("should extract 1st level expansion", () => {
            // arrange
            let q = Query.All({
                entityType: Artist,
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
                entityType: Artist,
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
            entityType: Artist,
            expand: `albums/{tags/tag,songs/tags/tag}`
        });

        expect(q.numExpansions).toEqual(6);
    });
});

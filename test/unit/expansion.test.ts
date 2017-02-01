import { Expansion, getEntityMetadata } from "../../src";
import { Artist, Album, Song } from "../common";

describe("expansion", () => {
    it("return value of toString() should be parsable by parse()", () => {
        let original = Expansion.parse(Album, "songs/{album,tags},tags");
        let parsed = Expansion.parse(Album, original.map(o => o.toString()).join(","));

        expect(original.toString()).toEqual(parsed.toString());
    });

    describe("parse()", () => {
        it("should return expected amount of expansions", () => {
            let expansions = Expansion.parse(Album, "songs/{album,tags},tags");

            expect(expansions.length).toBe(2);
        });

        it("should return empty array for empty string", () => {
            let expansions = Expansion.parse(Album, "");

            expect(expansions.length).toBe(0);
        });
    });

    describe("toString()", () => {
        it("should return albums", () => {
            let str = "albums";
            let exp = Expansion.parse(Artist, str);

            expect(exp.toString()).toEqual(str);
        });

        it("should return albums/songs", () => {
            let str = "albums/songs";
            let exp = Expansion.parse(Artist, str);

            expect(exp.toString()).toEqual(str);
        });

        it("should return albums/{songs,tags}", () => {
            let str = "albums/{songs,tags}";
            let exp = Expansion.parse(Artist, str);

            expect(exp.toString()).toEqual(str);
        });

        it("should return albums/{songs/album/{artist,songs},tags}", () => {
            let str = "albums/{songs/album/{artist,songs},tags}";
            let exp = Expansion.parse(Artist, str);

            expect(exp.toString()).toEqual(str);
        });

        it("should return songs/{album/{artist,songs},tags},artist", () => {
            let str = "songs/{album/{artist,songs},tags},artist";
            let exp = Expansion.parse(Album, str);

            expect(exp.toString()).toEqual(str);
        });
    });

    describe("toPaths()", () => {
        it("should flatten a multi-level expansion", () => {
            let exp = Expansion.parse(Artist, "albums/{songs/album/{artist,songs},tags}");
            let paths = exp[0].toPaths();

            expect(paths.map(p => p.toString()).join(",")).toEqual("albums/songs/album/artist,albums/songs/album/songs,albums/tags");
        });
    });

    describe("extract()", () => {
        it("should extract a virtual expansion", () => {
            // arrange
            let exp = Expansion.parse(Song, "album/reviews/review");

            // act
            let [reducedExp, extracted] = exp[0].extract(x => x.property.virtual);

            // assert
            expect(reducedExp.toString()).toEqual("album");
            expect(extracted[0].extracted.toString()).toEqual("reviews/review");
        });

        it("should extract 1st level expansion", () => {
            // arrange
            let exp = Expansion.parse(Artist, "albums/{songs/album/artist,tags}");
            let songsProp = getEntityMetadata(Album).getNavigation("songs");

            // act
            let [reducedExp, extracted] = exp[0].extract(x => x.property == songsProp);

            // assert
            expect(reducedExp.toString()).toEqual("albums/tags");
            expect(extracted.length).toEqual(1);
            expect(extracted[0].path.toString()).toEqual("albums");
            expect(extracted[0].extracted.property).toEqual(songsProp);
            expect(extracted[0].extracted.toString()).toEqual("songs/album/artist");
        });

        it("should extract 2nd level expansion", () => {
            // arrange
            let exp = Expansion.parse(Artist, "albums/{songs/album/artist,tags}");
            let albumProp = getEntityMetadata(Song).getNavigation("album");

            // act
            let [reducedExp, extracted] = exp[0].extract(x => x.property == albumProp);

            // assert
            expect(reducedExp.toString()).toEqual("albums/{songs,tags}");
            expect(extracted.length).toEqual(1);
            expect(extracted[0].path.toString()).toEqual("albums/songs");
            expect(extracted[0].extracted.property).toEqual(albumProp);
            expect(extracted[0].extracted.toString()).toEqual("album/artist");
        });

        it("should extract nothing", () => {
            // arrange
            let exp = Expansion.parse(Artist, "albums/{songs/album,tags}");
            let artistProp = getEntityMetadata(Album).getNavigation("artist");

            // act
            let [reducedExp, extracted] = exp[0].extract(x => x.property == artistProp);

            // assert
            expect(reducedExp.toString()).toEqual(exp.toString());
            expect(extracted.length).toEqual(0);
        });
    });

    describe("isSuperset()", () => {
        it("should return true for equal expansions", () => {
            let expA = Expansion.parse(Song, "album/{artist,tags/tag/type},tags/tag/type");
            let expB = Expansion.parse(Song, "album/{artist,tags/tag/type},tags/tag/type");

            let result = Expansion.isSuperset(expA, expB);

            expect(result).toEqual(true);
        });

        it("should ignore order of expansions", () => {
            let tags = Expansion.parse(Album, "tags")[0];
            let songs = Expansion.parse(Album, "songs")[0];

            // testing that the function sorts the expansions
            let result = Expansion.isSuperset([tags, songs], [songs, tags]);

            expect(result).toEqual(true);
        });

        it("albums/{songs,tags} should not be a superset of albums/{artist,songs}", () => {
            let a = Expansion.parse(Album, "songs,tags");
            let b = Expansion.parse(Album, "artist,songs");

            let result = Expansion.isSuperset(a, b);

            expect(result).toEqual(false);
        });
    });
});

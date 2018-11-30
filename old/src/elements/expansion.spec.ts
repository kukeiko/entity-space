import { getMetadata, EntityClass, Property } from "../metadata";
import { Expansion } from "./expansion";
import { Artist, Album, Song } from "../../test/facade";

describe("expansion", () => {
    it("return value of toString() should be parsable by parse()", () => {
        let original = Expansion.parse(Album, "songs/{album,tags},tags");
        let parsed = Expansion.parse(Album, original.map(o => o.toString()).join(","));

        expect(original.toString()).toEqual(parsed.toString());
    });

    describe("parse()", () => {
        it("should return expected amount of expansions", () => {
            expect(Expansion.parse(Album, "songs/{album,tags},tags").length).toBe(2);
            expect(Expansion.parse(Album, "").length).toBe(0);
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

    @EntityClass()
    class Dan {
        @Property.Id()
        id: number = null;
    }

    @EntityClass()
    class Foo {
        @Property.Id()
        id: number = null;
    }

    @EntityClass()
    class Mo {
        @Property.Id()
        id: number = null;

        @Property.Primitive()
        danId: number = null;

        @Property.Reference({ key: "danId", other: () => Dan })
        dan: Dan = null;

        @Property.Primitive()
        fooId: number = null;

        @Property.Reference({ key: "fooId", other: () => Foo })
        foo: Foo = null;
    }

    @EntityClass()
    class Khaz {
        @Property.Id()
        id: number = null;

        @Property.Primitive()
        moId: number = null;

        @Property.Reference({ key: "moId", other: () => Mo })
        mo: Mo = null;

        @Property.Primitive()
        danId: number = null;

        @Property.Reference({ key: "danId", other: () => Dan })
        dan: Dan = null;
    }

    describe("add()", () => {
        it("[mo] + [mo] should be [mo]", () => {
            let x = Expansion.parse(Khaz, `mo`);
            let y = Expansion.parse(Khaz, `mo`);

            expect(Expansion.add(x, y).toString()).toEqual(`mo`);
        });

        it("[mo] + [dan] should be [dan,mo]", () => {
            let moExpansion = Expansion.parse(Khaz, `mo`);
            let danExpansion = Expansion.parse(Khaz, `dan`);

            let merged = Expansion.add(moExpansion, danExpansion);

            expect(merged.toString()).toEqual("dan,mo");
        });

        it("[mo/dan] + [dan] should be [dan,mo/dan]", () => {
            let moDanExpansion = Expansion.parse(Khaz, `mo/dan`);
            let danExpansion = Expansion.parse(Khaz, `dan`);

            let merged = Expansion.add(moDanExpansion, danExpansion);

            expect(merged.toString()).toEqual("dan,mo/dan");
        });

        it("[mo/dan] + [mo/foo] should be [mo/{dan,foo}]", () => {
            let moDanExpansion = Expansion.parse(Khaz, `mo/dan`);
            let moFooExpansion = Expansion.parse(Khaz, `mo/foo`);

            let merged = Expansion.add(moDanExpansion, moFooExpansion);

            expect(merged.toString()).toEqual("mo/{dan,foo}");
        });

        it("[mo/dan] + [mo/foo,dan] should be [dan,mo/{dan,foo}]", () => {
            let moDanExpansion = Expansion.parse(Khaz, `mo/dan`);
            let moFooExpansion = Expansion.parse(Khaz, `mo/foo,dan`);

            let merged = Expansion.add(moDanExpansion, moFooExpansion);

            expect(merged.toString()).toEqual("dan,mo/{dan,foo}");
        });

        it("[] + [] should be []", () => {
            expect(Expansion.add([], [])).toEqual([]);
        });

        it("[mo] + [] should be [mo]", () => {
            let mo = Expansion.parse(Khaz, `mo`);

            expect(Expansion.add(mo, []).toString()).toEqual(`mo`);
        });

        it("[] + [mo] should be [mo]", () => {
            let mo = Expansion.parse(Khaz, `mo`);

            expect(Expansion.add([], mo).toString()).toEqual(`mo`);
        });
    });

    describe("minus()", () => {
        it("[mo] - [mo] should be []", () => {
            let x = Expansion.parse(Khaz, `mo`);
            let y = Expansion.parse(Khaz, `mo`);

            expect(Expansion.minus(x, y)).toEqual([]);
        });

        it("[mo] - [dan] should be [mo]", () => {
            let x = Expansion.parse(Khaz, `mo`);
            let y = Expansion.parse(Khaz, `dan`);

            expect(Expansion.minus(x, y).toString()).toEqual(`mo`);
        });

        it("[mo/dan] - [mo] should be [mo/dan]", () => {
            let x = Expansion.parse(Khaz, `mo/dan`);
            let y = Expansion.parse(Khaz, `mo`);

            expect(Expansion.minus(x, y).toString()).toEqual(`mo/dan`);
        });

        it("[mo/{dan,foo}] - [mo/dan] should be [mo/foo]", () => {
            let x = Expansion.parse(Khaz, `mo/{dan,foo}`);
            let y = Expansion.parse(Khaz, `mo/dan`);

            expect(Expansion.minus(x, y).toString()).toEqual(`mo/foo`);
        });

        it("[mo,dan] - [mo] should be [dan]", () => {
            let x = Expansion.parse(Khaz, `mo,dan`);
            let y = Expansion.parse(Khaz, `mo`);

            expect(Expansion.minus(x, y).toString()).toEqual(`dan`);
        });

        it("[mo] - [mo,dan] should be []", () => {
            let x = Expansion.parse(Khaz, `mo`);
            let y = Expansion.parse(Khaz, `mo,dan`);

            expect(Expansion.minus(x, y)).toEqual([]);
        });

        it("[mo] - [mo/dan] should be []", () => {
            let x = Expansion.parse(Khaz, `mo`);
            let y = Expansion.parse(Khaz, `mo/dan`);

            expect(Expansion.minus(x, y)).toEqual([]);
        });

        it("[] - [] should be []", () => {
            expect(Expansion.minus([], [])).toEqual([]);
        });

        it("[] - [dan] should be []", () => {
            let dan = Expansion.parse(Khaz, `dan`);

            expect(Expansion.minus([], dan)).toEqual([]);
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
            let songsProp = getMetadata(Album).getNavigation("songs");

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
            let albumProp = getMetadata(Song).getNavigation("album");

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
            let artistProp = getMetadata(Album).getNavigation("artist");

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

import { SelectEntity } from "@entity-space/elements";
import { Artist, ArtistBlueprint, Song, SongBlueprint, SongTag, Tag } from "@entity-space/elements/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { EntityWorkspace } from "../entity-workspace";
import { TestFacade, TestRepository } from "../testing";
import { createMetadata } from "../testing/create-metadata.fn";

describe("[from archive] system supports", () => {
    let facade: TestFacade;
    let repository: TestRepository;
    let workspace: EntityWorkspace;

    beforeEach(() => {
        facade = new TestFacade();
        repository = facade.getTestRepository();
        workspace = facade.getWorkspace();
    });

    let artists: Artist[];
    let songs: Song[];
    let songTags: SongTag[];
    let tags: Tag[];

    beforeEach(() => {
        artists = [
            {
                id: 1,
                name: "Infected Mushroom",
                country: "Isreal",
                namespace: "dev",
                metadata: createMetadata(1),
            },
            {
                id: 2,
                name: "Hedflux",
                country: "Scotland",
                namespace: "dev",
                metadata: createMetadata(1),
            },
            {
                id: 3,
                name: "Sunnexo",
                country: "Netherlands",
                namespace: "dev",
                metadata: createMetadata(1),
            },
            {
                id: 4,
                name: "No Songs Artist",
                country: "Lazyland",
                namespace: "dev",
                metadata: createMetadata(1),
            },
        ];

        songs = [
            // Infected Mushroom
            {
                id: 10,
                artistId: 1,
                albumId: 100,
                name: "Frog Machine",
                duration: 370,
                namespace: "dev",
                metadata: createMetadata(1),
            },
            {
                id: 11,
                artistId: 1,
                albumId: 200,
                name: "Blue Swan 5",
                duration: 538,
                namespace: "dev",
                metadata: createMetadata(1),
            },
            {
                id: 12,
                artistId: 1,
                albumId: 300,
                name: "Animatronica",
                duration: 375,
                namespace: "dev",
                metadata: createMetadata(1),
            },
            // Hedflux
            {
                id: 20,
                artistId: 2,
                albumId: 400,
                name: "Sacralicious",
                duration: 446,
                namespace: "dev",
                metadata: createMetadata(1),
            },
            // Sunnexo
        ];

        tags = [{ id: "upbeat", name: "Upbeat" }];
        songTags = [{ songId: 10, tagId: "upbeat" }];
        repository.useMusic().useEntities({ artists, songs, songTags, tags });
    });

    describe("finding one entity by id", () => {
        it("by loading from source", async () => {
            // arrange
            const expected = artists[0];
            const id = expected.id;
            const loadArtistById = repository.useMusic().useLoadArtistById();

            // act
            const actual = await workspace.from(ArtistBlueprint).select({ country: true }).where({ id }).findOne();

            // assert
            expect(actual).toEqual(expected);
            expect(loadArtistById).toHaveBeenCalledTimes(1);
        });

        it("by loading from cache", async () => {
            // arrange
            const expected = artists[0];
            const id = expected.id;
            const loadArtistById = repository.useMusic().useLoadArtistById();

            // act
            await workspace.from(ArtistBlueprint).select({ country: true }).where({ id }).cache(true).findOne(); // load into cache
            const actual = await workspace.from(ArtistBlueprint).where({ id }).cache(true).findOne(); // load from cache

            // assert
            expect(actual).toEqual(expected);
            expect(loadArtistById).toHaveBeenCalledTimes(1);
        });

        it("by loading from cache using the result of a superset query", async () => {
            // arrange
            const expected = artists[0];
            const id = expected.id;
            const loadArtistById = repository.useMusic().useLoadArtistById();
            const ids = artists.map(artist => artist.id);

            // act
            // load into cache all the artists
            await workspace.from(ArtistBlueprint).select({ country: true }).where({ id: ids }).cache(true).get();
            // query the one artist we actually want
            const actual = await workspace.from(ArtistBlueprint).where({ id }).cache(true).findOne();

            // assert
            expect(actual).toEqual(expected);
            expect(loadArtistById).toHaveBeenCalledTimes(artists.length);
        });

        // [todo] ❌ cache invalidation currently not available like this
        it.skip("invalidating the cache", async () => {
            // // arrange
            // const expected = artists[0];
            // const id = expected.id;
            // const loadArtistById = addLoadArtistById();
            // // act
            // await workspace.from(ArtistBlueprint).where({ id }).cache(true).findOne(); // load into cache
            // workspace.invalidate(ArtistBlueprint, { where: { id } });
            // const actual = await workspace.from(ArtistBlueprint).where({ id }).cache(true).findOne();
            // // assert
            // expect(actual).toEqual(expected);
            // expect(loadArtistById).toHaveBeenCalledTimes(2);
        });

        // [todo] add "by loading from cache" tests
        describe("and hydration of", () => {
            describe("a relation", () => {
                it("by loading from source", async () => {
                    // arrange
                    const song = songs[0];
                    const expected: SelectEntity<Song, { artist: true }> = {
                        ...song,
                        artist: artists.find(artist => artist.id === song.artistId)!,
                    };
                    const id = expected.id;
                    const loadSongById = repository.useMusic().useLoadSongById();
                    const loadArtistById = repository.useMusic().useLoadArtistById();

                    // act
                    const actual = await workspace
                        .from(SongBlueprint)
                        .where({ id })
                        .select({ artist: { country: true } })
                        .findOne();

                    // assert
                    expect(actual).toEqual(expected);
                    expect(loadSongById).toHaveBeenCalledTimes(1);
                    expect(loadArtistById).toHaveBeenCalledTimes(1);
                });
            });

            describe("an array relation", () => {
                it("by loading from source", async () => {
                    // arrange
                    const artist = artists[0];
                    const expected: SelectEntity<Artist, { songs: true }> = {
                        ...artist,
                        songs: songs
                            .filter(song => song.artistId === artist.id)
                            .sort((a, b) => a.name.localeCompare(b.name)),
                    };
                    const id = expected.id;
                    const loadArtistById = repository.useMusic().useLoadArtistById();
                    const loadSongsByArtistId = repository.useMusic().useLoadSongsByArtistId();

                    // act
                    const actual = await workspace
                        .from(ArtistBlueprint)
                        .where({ id })
                        .select({ country: true, songs: true })
                        .findOne();

                    // assert
                    expect(actual).toEqual(expected);
                    expect(loadArtistById).toHaveBeenCalledTimes(1);
                    expect(loadSongsByArtistId).toHaveBeenCalledTimes(1);
                });
            });
        });

        it("and hydrating a primitive property using a custom hydrator", async () => {
            // arrange
            const artist = artists[0];
            const expected: SelectEntity<Artist, { title: true }> = {
                ...artist,
                title: repository.useMusic().toArtistTitle(artist),
            };
            const id = expected.id;
            const loadArtistById = repository.useMusic().useLoadArtistById();
            const hydrateArtistTitle = repository.useMusic().useHydrateArtistTitle();

            // act
            const actual = await workspace.from(ArtistBlueprint).where({ id }).select({ title: true }).findOne();

            // assert
            expect(actual).toEqual(expected);
            expect(loadArtistById).toHaveBeenCalledTimes(1);
            expect(hydrateArtistTitle).toHaveBeenCalledTimes(1);
        });
    });

    describe("finding multiple entities by id", () => {
        describe("using a source that returns multiple artists by id", () => {
            it("by loading from source", async () => {
                // arrange
                const expected = artists.slice();
                const id = expected.map(artist => artist.id);
                const loadArtistsById = repository.useMusic().useLoadArtistsByIds();

                // act
                const actual = await workspace.from(ArtistBlueprint).where({ id }).get();

                // assert
                expect(actual).toEqual(expected);
                expect(loadArtistsById).toHaveBeenCalledTimes(1);
            });

            it("by loading from cache", async () => {
                // arrange
                const expected = artists.slice();
                const id = expected.map(artist => artist.id);
                const loadArtistsById = repository.useMusic().useLoadArtistsByIds();

                // act
                await workspace.from(ArtistBlueprint).where({ id }).cache(true).get(); // load into cache
                const actual = await workspace.from(ArtistBlueprint).where({ id }).cache(true).get();

                // assert
                expect(actual).toEqual(expected);
                expect(loadArtistsById).toHaveBeenCalledTimes(1);
            });

            it("by partially loading from cache", async () => {
                // arrange
                const expected = artists.slice();
                const loadIntoCacheId = artists[0].id;
                const id = expected.map(artist => artist.id);
                const expectedLoadFromSourceIds = id.filter(id => id !== loadIntoCacheId);
                const loadArtistsById = repository.useMusic().useLoadArtistsByIds();

                // act
                await workspace.from(ArtistBlueprint).where({ id: loadIntoCacheId }).cache(true).get();
                const actual = await workspace.from(ArtistBlueprint).where({ id }).cache(true).get();

                // assert
                expect(actual).toEqual(expected);
                expect(loadArtistsById).toHaveBeenCalledTimes(2);
                expect(loadArtistsById).toHaveBeenNthCalledWith(1, [loadIntoCacheId]);
                expect(loadArtistsById).toHaveBeenNthCalledWith(2, expectedLoadFromSourceIds);
            });

            // [todo] ❌ cache invalidation currently not available like this
            it.skip("invalidating the cache", async () => {
                //     // arrange
                //     const expected = artists.slice();
                //     const id = expected.map(artist => artist.id);
                //     const loadArtistsById = addLoadArtistsById();
                //     // act
                //     await workspace.from(ArtistBlueprint).where({ id }).getAll(); // load into cache
                //     workspace.invalidate(ArtistBlueprint, { where: { id } });
                //     const actual = await workspace.from(ArtistBlueprint).where({ id }).getAll();
                //     // assert
                //     expect(actual).toEqual(expected);
                //     expect(loadArtistsById).toHaveBeenCalledTimes(2);
            });
        });

        describe("using a source that returns one artist by id", () => {
            it("by loading from source", async () => {
                // arrange
                const expected = artists.slice();
                const id = expected.map(artist => artist.id);
                const loadArtistById = repository.useMusic().useLoadArtistById();

                // act
                const actual = await workspace.from(ArtistBlueprint).select({ country: true }).where({ id }).get();

                // assert
                expect(actual).toEqual(expected);
                expect(loadArtistById).toHaveBeenCalledTimes(id.length);
            });

            it("by loading from cache", async () => {
                // arrange
                const expected = artists.slice();
                const id = expected.map(artist => artist.id);
                const loadArtistById = repository.useMusic().useLoadArtistById();

                // act
                await workspace.from(ArtistBlueprint).select({ country: true }).where({ id }).cache(true).get(); // load into cache
                const actual = await workspace.from(ArtistBlueprint).where({ id }).cache(true).get();

                // assert
                expect(actual).toEqual(expected);
                expect(loadArtistById).toHaveBeenCalledTimes(id.length);
            });
        });
    });

    // [todo] ❌ "or" has been disabled during porting to reduce scope
    it("combining different sources to resolve a query", async () => {
        // // arrange
        // const expected = [songs[0], songs[1]];
        // const id = expected[0].id;
        // const name = expected[1].name;
        // const loadSongById = repository.useLoadSongById();
        // const loadSongByName = repository.useLoadSongByName();
        // // act
        // const actual = await workspace
        //     .from(SongBlueprint)
        //     .where({ $or: [{ id }, { name }] })
        //     .get();
        // // assert
        // expect(actual).toEqual(expected);
        // expect(loadSongById).toHaveBeenCalledTimes(1);
        // expect(loadSongByName).toHaveBeenCalledTimes(1);
    });

    // [todo] ❌ cache invalidation currently not available like this
    it.skip("invalidating the cache by ids", async () => {
        //     // arrange
        //     const expected = artists.slice();
        //     const id = expected.map(artist => artist.id);
        //     const invalidatedIds = id.filter((_, index) => index % 2 == 0);
        //     const loadArtistsById = addLoadArtistsById();
        //     // act
        //     await workspace.from(ArtistBlueprint).where({ id }).cache(true).getAll(); // load into cache
        //     workspace.invalidate(ArtistBlueprint, { where: { id: invalidatedIds } });
        //     const actual = await workspace.from(ArtistBlueprint).where({ id }).cache(true).getAll();
        //     // assert
        //     expect(actual).toEqual(expected);
        //     expect(loadArtistsById).toHaveBeenCalledTimes(2);
        //     expect(loadArtistsById).toHaveBeenNthCalledWith(1, id);
        //     expect(loadArtistsById).toHaveBeenNthCalledWith(2, invalidatedIds);
    });

    it("having a custom hydrator depend on the auto hydrator", async () => {
        // arrange
        const artist = artists[0];
        const expected: SelectEntity<Artist, { longestSong: true; songs: true }> = {
            ...artist,
            // [todo] ❓ we cannot just use "findLongestSong()" as the Select removes "undefined", meaning that we expect a hydrated property
            // to never be able to be undefined. That is fine if we enforce the user to use "null" instead, but that has some DX implications.
            longestSong: repository.useMusic().getLongestSong(songs.filter(song => song.artistId === artist.id)),
            songs: songs.filter(song => song.artistId === artist.id).sort((a, b) => a.name.localeCompare(b.name)),
        };
        const id = expected.id;
        const loadArtistById = repository.useMusic().useLoadArtistById();
        const loadSongsByArtistId = repository.useMusic().useLoadSongsByArtistId();
        const hydrateArtistLongestSong = repository.useMusic().useHydrateArtistLongestSong();

        // act
        const actual = await workspace
            .from(ArtistBlueprint)
            .where({ id })
            .select({ country: true, songs: true, longestSong: true })
            .findOne();

        // assert
        expect(actual).toEqual(expected);
        expect(loadArtistById).toHaveBeenCalledTimes(1);
        expect(loadSongsByArtistId).toHaveBeenCalledTimes(1);
        expect(hydrateArtistLongestSong).toHaveBeenCalledTimes(1);
    });

    it("having a custom hydrator depend on the auto hydrator (deep relation)", async () => {
        // arrange
        const artist = artists[0];

        const expected: SelectEntity<Artist, { songTags: true }> = {
            ...artist,
            songTags: [],
            songs: songs
                .filter(song => song.artistId === artist.id)
                .sort((a, b) => a.name.localeCompare(b.name))
                .map(song => {
                    const tagIds = songTags.filter(songTag => songTag.songId === song.id).map(songTag => songTag.tagId);
                    const thisTags = tags.filter(tag => tagIds.includes(tag.id));

                    return { ...song, tagIds, tags: thisTags };
                }),
        };
        const songTagIds = Array.from(new Set(expected.songs?.flatMap(song => song.tagIds ?? []) ?? []));
        expected.songTags = tags.filter(tag => songTagIds.includes(tag.id));
        const id = expected.id;
        const loadArtistById = repository.useMusic().useLoadArtistById();
        const loadSongsByArtistId = repository.useMusic().useLoadSongsByArtistId();
        repository.useMusic().useLoadTagById();
        repository.useMusic().useHydrateSongTagIds();
        repository.useMusic().useHydrateArtistSongTags();

        // act
        const actual = await workspace
            .from(ArtistBlueprint)
            .where({ id })
            .select({ country: true, songTags: true })
            .findOne();

        // assert
        expect(actual).toEqual(expected);
        expect(loadArtistById).toHaveBeenCalledTimes(1);
        expect(loadSongsByArtistId).toHaveBeenCalledTimes(1);
    });
});

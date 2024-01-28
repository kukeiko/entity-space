import { Select } from "../../lib/common/select.type";
import { EntityServiceContainer } from "../../lib/execution/entity-service-container";
import { EntityWorkspace } from "../../lib/execution/entity-workspace";
import { Artist, ArtistBlueprint } from "../content";
import { Song, SongBlueprint } from "../content/music/song.model";

describe("system", () => {
    // [todo] we might want every test that works on a single artist to test against all artists
    const artists: Artist[] = [
        { id: 1, name: "Infected Mushroom", country: "Isreal" },
        { id: 2, name: "Hedflux", country: "Scotland" },
        { id: 3, name: "Sunnexo", country: "Netherlands" },
    ];

    const songs: Song[] = [
        // Infected Mushroom
        { id: 10, artistId: 1, name: "Frog Machine", duration: 370 },
        { id: 11, artistId: 1, name: "Blue Swan 5", duration: 538 },
        { id: 12, artistId: 1, name: "Animatronica", duration: 375 },
        // Hedflux
        { id: 20, artistId: 1, name: "Sacralicious", duration: 446 },
        // Sunnexo
    ];

    let services: EntityServiceContainer;
    let workspace: EntityWorkspace;

    beforeEach(() => {
        services = new EntityServiceContainer();
        workspace = new EntityWorkspace(services);
    });

    function addLoadArtistById() {
        const loadArtistById = jest.fn((id: number) => artists.filter(artist => artist.id === id));

        services.for(ArtistBlueprint).addSource({
            where: { id: Number },
            load: ({ criteria: { id } }) => loadArtistById(id),
        });

        return loadArtistById;
    }

    function addLoadArtistsById() {
        const loadArtistsById = jest.fn((ids: number[]) => artists.filter(artist => ids.includes(artist.id)));

        services.for(ArtistBlueprint).addSource({
            where: { id: [Number] },
            load: ({ criteria: { id } }) => loadArtistsById(id),
        });

        return loadArtistsById;
    }

    function addLoadSongById() {
        const loadSongById = jest.fn((id: number) => songs.filter(song => song.id === id));

        services.for(SongBlueprint).addSource({
            where: { id: Number },
            load: ({ criteria: { id } }) => loadSongById(id),
        });

        return loadSongById;
    }

    function getSongsByArtistIds(artistIds: number[]): Song[] {
        return songs.filter(song => artistIds.includes(song.artistId));
    }

    function addLoadSongsByArtistId() {
        const loadSongsByArtistId = jest.fn((artistIds: number[]) => getSongsByArtistIds(artistIds));

        services.for(SongBlueprint).addSource({
            where: { artistId: [Number] },
            load: ({ criteria: { artistId } }) => loadSongsByArtistId(artistId),
        });

        return loadSongsByArtistId;
    }

    function toArtistTitle(artist: Artist): string {
        return `${artist.name} (${artist.country})`;
    }

    function addHydrateArtistTitle() {
        const hydrate = jest.fn((artists: Artist[]) => {
            artists.forEach(entity => (entity.title = toArtistTitle(entity)));
            return artists;
        });

        services.for(ArtistBlueprint).addHydrator({
            requires: { name: true, country: true },
            select: { title: true },
            hydrate,
        });

        return hydrate;
    }

    function findLongestSong(songs: Song[]): Song | undefined {
        return (songs ?? []).sort((a, b) => b.duration - a.duration)[0];
    }

    function getLongestSong(songs: Song[]): Song {
        const longestSong = findLongestSong(songs);

        if (!longestSong) {
            throw new Error("no longest song found");
        }

        return longestSong;
    }

    function addHydrateArtistLongestSong() {
        const hydrate = jest.fn((artists: Artist[]) => {
            artists.forEach(artist => (artist.longestSong = findLongestSong(artist.songs ?? [])));
            return artists;
        });

        services.for(ArtistBlueprint).addHydrator({
            // [todo] expected to be able to provide a PackedEntitySelection
            requires: { songs: { duration: true } },
            select: { longestSong: { id: true, artistId: true, duration: true, name: true } },
            hydrate,
        });

        return hydrate;
    }

    describe("supports", () => {
        describe("finding one entity by id", () => {
            it("by loading from source", async () => {
                // arrange
                const expected = artists[0];
                const id = expected.id;
                const loadArtistById = addLoadArtistById();

                // act
                const actual = await workspace.from(ArtistBlueprint).findOne({ where: { id } });

                // assert
                expect(actual).toEqual(expected);
                expect(loadArtistById).toHaveBeenCalledTimes(1);
            });

            it("by loading from cache", async () => {
                // arrange
                const expected = artists[0];
                const id = expected.id;
                const loadArtistById = addLoadArtistById();

                // act
                await workspace.from(ArtistBlueprint).findOne({ where: { id } }); // load into cache
                const actual = await workspace.from(ArtistBlueprint).findOne({ where: { id } }); // load from cache

                // assert
                expect(actual).toEqual(expected);
                expect(loadArtistById).toHaveBeenCalledTimes(1);
            });

            it("by loading from cache using the result of a superset query", async () => {
                // arrange
                const expected = artists[0];
                const id = expected.id;
                const loadArtistById = addLoadArtistById();
                const ids = artists.map(artist => artist.id);

                // act
                await workspace.from(ArtistBlueprint).findMany({ where: { id: ids } }); // load into cache
                const actual = await workspace.from(ArtistBlueprint).findOne({ where: { id } });

                // assert
                expect(actual).toEqual(expected);
                expect(loadArtistById).toHaveBeenCalledTimes(3);
            });

            it("invalidating the cache", async () => {
                // arrange
                const expected = artists[0];
                const id = expected.id;
                const loadArtistById = addLoadArtistById();

                // act
                await workspace.from(ArtistBlueprint).findOne({ where: { id } }); // load into cache
                workspace.invalidate(ArtistBlueprint, { where: { id } });
                const actual = await workspace.from(ArtistBlueprint).findOne({ where: { id } });

                // assert
                expect(actual).toEqual(expected);
                expect(loadArtistById).toHaveBeenCalledTimes(2);
            });

            // [todo] add "by loading from cache" tests
            describe("and automatically hydrating", () => {
                describe("a relation", () => {
                    it("by loading from source", async () => {
                        // arrange
                        const song = songs[0];
                        const expected: Select<Song, { artist: true }> = {
                            ...song,
                            artist: artists.find(artist => artist.id === song.artistId)!,
                        };
                        const id = expected.id;
                        const loadSongById = addLoadSongById();
                        const loadArtistById = addLoadArtistById();

                        // act
                        const actual = await workspace
                            .from(SongBlueprint)
                            .findOne({ where: { id }, select: { artist: true } });

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
                        const expected: Select<Artist, { songs: true }> = {
                            ...artist,
                            songs: songs.filter(song => song.artistId === artist.id),
                        };
                        const id = expected.id;
                        const loadArtistById = addLoadArtistById();
                        const loadSongsByArtistId = addLoadSongsByArtistId();

                        // act
                        const actual = await workspace
                            .from(ArtistBlueprint)
                            .findOne({ where: { id }, select: { songs: true } });

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
                const expected: Select<Artist, { title: true }> = { ...artist, title: toArtistTitle(artist) };
                const id = expected.id;
                const loadArtistById = addLoadArtistById();
                const hydrateArtistTitle = addHydrateArtistTitle();

                // act
                const actual = await workspace
                    .from(ArtistBlueprint)
                    .findOne({ where: { id }, select: { title: true } });

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
                    const loadArtistsById = addLoadArtistsById();

                    // act
                    const actual = await workspace.from(ArtistBlueprint).findMany({ where: { id } });

                    // assert
                    expect(actual).toEqual(expected);
                    expect(loadArtistsById).toHaveBeenCalledTimes(1);
                });

                it("by loading from cache", async () => {
                    // arrange
                    const expected = artists.slice();
                    const id = expected.map(artist => artist.id);
                    const loadArtistsById = addLoadArtistsById();

                    // act
                    await workspace.from(ArtistBlueprint).findMany({ where: { id } }); // load into cache
                    const actual = await workspace.from(ArtistBlueprint).findMany({ where: { id } });

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
                    const loadArtistsById = addLoadArtistsById();

                    // act
                    await workspace.from(ArtistBlueprint).findMany({ where: { id: loadIntoCacheId } });
                    const actual = await workspace.from(ArtistBlueprint).findMany({ where: { id } });

                    // assert
                    expect(actual).toEqual(expected);
                    expect(loadArtistsById).toHaveBeenCalledTimes(2);
                    expect(loadArtistsById).toHaveBeenNthCalledWith(1, [loadIntoCacheId]);
                    expect(loadArtistsById).toHaveBeenNthCalledWith(2, expectedLoadFromSourceIds);
                });

                it("invalidating the cache", async () => {
                    // arrange
                    const expected = artists.slice();
                    const id = expected.map(artist => artist.id);
                    const loadArtistsById = addLoadArtistsById();

                    // act
                    await workspace.from(ArtistBlueprint).findMany({ where: { id } }); // load into cache
                    workspace.invalidate(ArtistBlueprint, { where: { id } });
                    const actual = await workspace.from(ArtistBlueprint).findMany({ where: { id } });

                    // assert
                    expect(actual).toEqual(expected);
                    expect(loadArtistsById).toHaveBeenCalledTimes(2);
                });
            });

            describe("using a source that returns one artist by id", () => {
                it("by loading from source", async () => {
                    // arrange
                    const expected = artists.slice();
                    const id = expected.map(artist => artist.id);
                    const loadArtistById = addLoadArtistById();

                    // act
                    const actual = await workspace.from(ArtistBlueprint).findMany({ where: { id } });

                    // assert
                    expect(actual).toEqual(expected);
                    expect(loadArtistById).toHaveBeenCalledTimes(id.length);
                });

                it("by loading from cache", async () => {
                    // arrange
                    const expected = artists.slice();
                    const id = expected.map(artist => artist.id);
                    const loadArtistById = addLoadArtistById();

                    // act
                    await workspace.from(ArtistBlueprint).findMany({ where: { id } }); // load into cache
                    const actual = await workspace.from(ArtistBlueprint).findMany({ where: { id } });

                    // assert
                    expect(actual).toEqual(expected);
                    expect(loadArtistById).toHaveBeenCalledTimes(id.length);
                });
            });
        });

        it("partially invalidating the cache", async () => {
            // arrange
            const expected = artists.slice();
            const id = expected.map(artist => artist.id);
            const invalidatedIds = id.filter((_, index) => index % 2 == 0);
            const loadArtistsById = addLoadArtistsById();

            // act
            await workspace.from(ArtistBlueprint).findMany({ where: { id } }); // load into cache
            workspace.invalidate(ArtistBlueprint, { where: { id: invalidatedIds } });
            const actual = await workspace.from(ArtistBlueprint).findMany({ where: { id } });

            // assert
            expect(actual).toEqual(expected);
            expect(loadArtistsById).toHaveBeenCalledTimes(2);
            expect(loadArtistsById).toHaveBeenNthCalledWith(1, id);
            expect(loadArtistsById).toHaveBeenNthCalledWith(2, invalidatedIds);
        });
    });

    describe("does not yet support", () => {
        it("having a custom hydrator depend on the auto hydrator", async () => {
            // arrange
            const artist = artists[0];
            // [todo] we might have artists without any songs in the test data
            const expected: Select<Artist, { longestSong: true }> = {
                ...artist,
                longestSong: getLongestSong(getSongsByArtistIds([artist.id])),
            };
            const id = expected.id;
            const loadArtistById = addLoadArtistById();
            const loadSongsByArtistId = addLoadSongsByArtistId();
            const hydrateArtistLongestSong = addHydrateArtistLongestSong();

            // act
            const actual = await workspace
                .from(ArtistBlueprint)
                .findOne({ where: { id }, select: { songs: true, longestSong: true } });

            // assert
            expect(actual).not.toEqual(expected);
            expect(loadArtistById).toHaveBeenCalledTimes(1);
            expect(loadSongsByArtistId).toHaveBeenCalledTimes(1);
            expect(hydrateArtistLongestSong).not.toHaveBeenCalledTimes(1);
        });

        describe("using the proper source when both an 'by-id' and an 'by-ids' source exists", () => {
            it("'by-ids' source first", async () => {
                // arrange
                const loadArtistsById = addLoadArtistsById();
                const loadArtistById = addLoadArtistById();
                const id = artists[0].id;

                // act
                await workspace.from(ArtistBlueprint).findOne({ where: { id } });

                // assert
                expect(loadArtistsById).toHaveBeenCalledTimes(1);
                expect(loadArtistById).toHaveBeenCalledTimes(0);
            });

            it("'by-id' source first", async () => {
                // arrange
                const loadArtistById = addLoadArtistById();
                const loadArtistsById = addLoadArtistsById();
                const id = artists.map(artist => artist.id);

                // act
                await workspace.from(ArtistBlueprint).findMany({ where: { id } });

                // assert
                expect(loadArtistsById).toHaveBeenCalledTimes(0);
                expect(loadArtistById).toHaveBeenCalledTimes(artists.length);
            });
        });
    });
});

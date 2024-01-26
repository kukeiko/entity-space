import { EntityServiceContainer } from "../../lib/execution/entity-service-container";
import { EntityWorkspace } from "../../lib/execution/entity-workspace";
import { Artist, ArtistBlueprint } from "../content";

describe("system", () => {
    const artists: Artist[] = [
        { id: 1, name: "Hedflux" },
        { id: 2, name: "Sunnexo" },
        { id: 3, name: "Infected Mushroom" },
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
                const actual = await workspace.from(ArtistBlueprint).findOne({ where: { id } });

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

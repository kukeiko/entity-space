import {
    getEntityMetadata, Entity, EntityMetadata,
    Expansion, ServiceCluster, Query, Workspace
} from "../../src";
import {
    Album, AlbumReview,
    Artist,
    Review,
    Song, TagType
} from "../common/entities";

describe("service-cluster", () => {
    describe("execute()", () => {
        it("should throw if required query executer has not been registered yet", async (done) => {
            let sc = new ServiceCluster(new Workspace());

            try {
                await sc.execute(new Query.All({ entityType: Album }));
                fail("expected to throw");
                done();
            } catch (error) {
                done();
            }
        });

        it("should return copies of the entities loaded by the query executer", async (done) => {
            let sc = new ServiceCluster(new Workspace());
            let albums = [new Album({ id: 1, name: "khaz" }), new Album({ id: 2, name: "mo" })];
            let loaded: any[] = [];

            sc.register(
                Album,
                {
                    loadAll: () => Promise.resolve(albums)
                });

            try {
                let map = await sc.execute(new Query.All({ entityType: Album }));
                loaded = Array.from(map.values()).sort((a, b) => a.id - b.id);
            } catch (error) {
                fail(error);
                done();
            }

            // they should be equal in terms of data,
            expect(loaded).toEqual(albums);
            // but be different instances
            expect(loaded[0]).not.toBe(albums[0]);
            expect(loaded[1]).not.toBe(albums[1]);

            done();
        });

        it("should not load from service twice due to cache", async (done) => {
            let sc = new ServiceCluster(new Workspace());
            let albums = [new Album({ id: 1 }), new Album({ id: 2 })];
            let numLoadCalled = 0;

            sc.register(
                Album,
                {
                    loadAll: () => {
                        numLoadCalled++;
                        return Promise.resolve(albums);
                    }
                });

            try {
                await sc.execute(new Query.All({ entityType: Album }));
                await sc.execute(new Query.All({ entityType: Album }));
            } catch (error) {
                fail(error);
                done();
            }

            expect(numLoadCalled).toEqual(1);
            done();
        });

        it("should execute Query.All and return expected payload", async (done) => {
            let sc = new ServiceCluster(new Workspace());
            let albums = [new Album({ id: 1 }), new Album({ id: 2 })];
            let loaded: any[] = [];

            sc.register(
                Album,
                {
                    loadAll: () => Promise.resolve(albums)
                });

            try {
                let map = await sc.execute(new Query.All({
                    entityType: Album
                }));

                loaded = Array.from(map.values());
            } catch (error) {
                fail(error);
                done();
            }

            expect(loaded).toEqual(albums);
            done();
        });

        it("should execute Query.ByKey and return expected payload", async (done) => {
            let sc = new ServiceCluster(new Workspace());
            let id = 64;
            let loaded: any[] = [];

            sc.register(
                Album,
                {
                    loadOne: (q: Query.ByKey<Album>) => Promise.resolve(new Album({ id: q.key }))
                });

            try {
                let map = await sc.execute(new Query.ByKey({
                    entityType: Album,
                    key: id
                }));

                loaded = Array.from(map.values());
            } catch (error) {
                fail(error);
                done();
            }

            expect(loaded[0]).toBeDefined();
            expect(loaded[0].id).toBe(id);
            done();
        });

        it("should execute Query.ByKeys and return expected payload", async (done) => {
            let sc = new ServiceCluster(new Workspace());
            let ids = [64, 32];
            let loaded: any[] = [];

            sc.register(
                Album,
                {
                    loadMany: (q: Query.ByKeys<Album>) => Promise.resolve(q.keys.map(k => new Album({ id: k })))
                });

            try {
                let map = await sc.execute(new Query.ByKeys({
                    entityType: Album,
                    keys: ids
                }));

                loaded = Array.from(map.values());
            } catch (error) {
                fail(error);
                done();
            }

            expect(loaded.map(e => e.id)).toEqual(ids);
            done();
        });

        it("should execute Query.ByIndex and return expected payload", async (done) => {
            let sc = new ServiceCluster(new Workspace());
            let loaded: any[] = [];
            let albums = [
                new Album({ id: 1, artistId: 77 }),
                new Album({ id: 2, artistId: 77 }),
                new Album({ id: 3, artistId: 77 })
            ];

            sc.register(
                Album,
                {
                    loadByIndex: (q: Query.ByIndex<Album>) => Promise.resolve(albums)
                });

            try {
                let map = await sc.execute(new Query.ByIndex({
                    entityType: Album,
                    index: "artistId",
                    value: 77
                }));

                loaded = Array.from(map.values());
            } catch (error) {
                fail(error);
                done();
            }

            expect(loaded).toEqual(albums);
            done();
        });

        it("should execute Query.ByIndexes and return expected payload", async (done) => {
            let sc = new ServiceCluster(new Workspace());
            let expected = new Album({ id: 1, artistId: 77, name: "khaz" });
            let loaded: any[] = [];
            let albums = [
                expected,
                new Album({ id: 2, artistId: 77, name: "mo" }),
                new Album({ id: 3, artistId: 77, name: "dan" })
            ];

            sc.register(
                Album,
                {
                    loadByIndexes: (q: Query.ByIndexes<Album>) => Promise.resolve(albums)
                });

            try {
                let map = await sc.execute(new Query.ByIndexes({
                    entityType: Album,
                    indexes: {
                        artistId: 77,
                        name: "khaz"
                    }
                }));

                loaded = Array.from(map.values());
            } catch (error) {
                fail(error);
                done();
            }

            expect(loaded).toEqual([expected]);
            done();
        });

        it("should throw if a query executer for hydration is missing", async (done) => {
            let sc = new ServiceCluster(new Workspace());

            sc.register(
                Album,
                {
                    loadAll: () => Promise.resolve([new Album({ id: 1 })])
                });

            try {
                await sc.execute(new Query.All({
                    entityType: Album,
                    expansions: Expansion.parse(Album, `reviews`)
                }));

                fail("expected to throw");
                done();
            } catch (error) {
                done();
            }
        });

        it("should hydrate a virtual collection", async (done) => {
            let sc = new ServiceCluster(new Workspace());
            let album = new Album({ id: 1 });
            let review = new AlbumReview({ id: 64, albumId: 1, album: album });
            album.reviews = [review];
            let albumMap: Map<any, Album>;

            sc.register(
                Album,
                {
                    loadAll: () => Promise.resolve([new Album({ id: 1 })])
                });

            sc.register(
                AlbumReview,
                {
                    loadByIndex: q => Promise.resolve([new AlbumReview({
                        id: 64,
                        albumId: 1
                    })])
                });

            try {
                albumMap = await sc.execute(new Query.All({
                    entityType: Album,
                    expansions: Expansion.parse(Album, `reviews`)
                }));
            } catch (error) {
                fail(error);
                done();
            }

            expect(albumMap.get(1).reviews[0]).toEqual(review);
            done();
        });

        it("should hydrate a virtual reference of a collection navigation", async (done) => {
            let sc = new ServiceCluster(new Workspace());
            let artist = new Artist({ id: 7 });
            let album = new Album({ id: 1, artistId: artist.id });
            let albumReview = new AlbumReview({ id: 64, albumId: album.id });
            let loaded: Map<any, any>;

            artist.albums = [album];
            album.artist = artist;
            album.reviews = [albumReview];
            albumReview.album = album;

            sc.register(
                Artist,
                {
                    loadAll: () => Promise.resolve([artist])
                });

            sc.register(
                Album,
                {
                    loadByIndex: q => Promise.resolve([album])
                });

            sc.register(
                AlbumReview,
                {
                    loadByIndex: q => Promise.resolve([albumReview])
                });

            try {
                loaded = await sc.execute(new Query.All({
                    entityType: Artist,
                    expansions: Expansion.parse(Artist, `albums/reviews`)
                }));
            } catch (error) {
                fail(error);
                done();
            }

            expect(loaded.get(artist.id).albums[0].reviews[0]).toEqual(albumReview);
            done();
        });

        it("should hydrate a virtual reference of a virtual collection", async (done) => {
            let sc = new ServiceCluster(new Workspace());
            let artist = new Artist({ id: 7 });
            let album = new Album({ id: 1, artistId: artist.id });
            let review = new Review({ id: "#moo", systemId: 8 });
            let albumReview = new AlbumReview({ id: 64, albumId: album.id, reviewExternalId: review.id, systemId: review.systemId });
            let loaded: Map<any, any>;

            artist.albums = [album];

            sc.register(
                Artist,
                {
                    loadAll: () => Promise.resolve([artist])
                });

            sc.register(
                Album,
                {
                    loadByIndex: q => Promise.resolve([album])
                });

            sc.register(
                Review,
                {
                    loadMany: q => Promise.resolve([review])
                });

            sc.register(
                AlbumReview,
                {
                    loadByIndex: q => Promise.resolve([albumReview])
                });

            try {
                loaded = await sc.execute(new Query.All({
                    entityType: Artist,
                    expansions: Expansion.parse(Artist, `albums/reviews/review`)
                }));
            } catch (error) {
                fail(error);
                done();
            }

            expect(loaded.get(artist.id).albums[0].reviews[0].review).toEqual(review);
            done();
        });
    });
});

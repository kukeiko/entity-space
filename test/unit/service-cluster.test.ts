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
                done()
            } catch (error) {
                done();
            }
        });

        it("should return copies of the entities loaded by the query executer", async (done) => {
            let sc = new ServiceCluster(new Workspace());
            let albums = [new Album({ id: 1, name: "khaz" }), new Album({ id: 2, name: "mo" })];

            sc.register({
                entityType: Album,
                loadAll: () => Promise.resolve(albums)
            });

            let map = await sc.execute(new Query.All({ entityType: Album }));
            let loaded = Array.from(map.values()).sort((a, b) => a.id - b.id);

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

            sc.register({
                entityType: Album,
                loadAll: () => {
                    numLoadCalled++;
                    return Promise.resolve(albums);
                }
            });

            await sc.execute(new Query.All({ entityType: Album }));
            await sc.execute(new Query.All({ entityType: Album }));

            expect(numLoadCalled).toEqual(1);
            done();
        });

        it("should throw if a query executer for hydration is missing", async (done) => {
            let sc = new ServiceCluster(new Workspace());

            sc.register({
                entityType: Album,
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
            let review = new AlbumReview({ id: 64, albumId: 1 });

            sc.register({
                entityType: Album,
                loadAll: () => Promise.resolve([new Album({ id: 1 })])
            });

            sc.register({
                entityType: AlbumReview,
                loadByIndex: q => Promise.resolve([review])
            });

            let album = await sc.execute(new Query.All({
                entityType: Album,
                expansions: Expansion.parse(Album, `reviews`)
            }));

            expect(album.get(1).reviews[0]).toEqual(review);
            done();
        });

        it("should hydrate a virtual reference of a collection navigation", async (done) => {
            let sc = new ServiceCluster(new Workspace());
            let artist = new Artist({ id: 7 });
            let album = new Album({ id: 1, artistId: artist.id });
            let albumReview = new AlbumReview({ id: 64, albumId: album.id });

            artist.albums = [album];

            sc.register({
                entityType: Artist,
                loadAll: () => Promise.resolve([artist])
            });

            sc.register({
                entityType: Album,
                loadByIndex: q => Promise.resolve([album])
            });

            sc.register({
                entityType: AlbumReview,
                loadByIndex: q => Promise.resolve([albumReview])
            });

            let loaded = await sc.execute(new Query.All({
                entityType: Artist,
                expansions: Expansion.parse(Artist, `albums/reviews`)
            }));

            expect(loaded.get(artist.id).albums[0].reviews[0]).toEqual(albumReview);
            done();
        });

        it("should hydrate a virtual reference of a virtual collection", async (done) => {
            let sc = new ServiceCluster(new Workspace());
            let artist = new Artist({ id: 7 });
            let album = new Album({ id: 1, artistId: artist.id });
            let review = new Review({ id: "#moo", systemId: 8 });
            let albumReview = new AlbumReview({ id: 64, albumId: album.id, reviewExternalId: review.id, systemId: review.systemId });

            artist.albums = [album];

            sc.register({
                entityType: Artist,
                loadAll: () => Promise.resolve([artist])
            });

            sc.register({
                entityType: Album,
                loadByIndex: q => Promise.resolve([album])
            });

            sc.register({
                entityType: Review,
                loadMany: q => Promise.resolve([review])
            });

            sc.register({
                entityType: AlbumReview,
                loadByIndex: q => Promise.resolve([albumReview])
            });

            let loaded = await sc.execute(new Query.All({
                entityType: Artist,
                expansions: Expansion.parse(Artist, `albums/reviews/review`)
            }));

            expect(loaded.get(artist.id).albums[0].reviews[0].review).toEqual(review);
            done();
        });

        it("should execute Query.All and return expected payload", async (done) => {
            let sc = new ServiceCluster(new Workspace());
            let albums = [new Album({ id: 1 }), new Album({ id: 2 })];

            sc.register({
                entityType: Album,
                loadAll: () => Promise.resolve(albums)
            });

            let map = await sc.execute(new Query.All({
                entityType: Album
            }));

            let loaded = Array.from(map.values());

            expect(loaded).toEqual(albums);
            done();
        });

        it("should execute Query.ByKey and return expected payload", async (done) => {
            let sc = new ServiceCluster(new Workspace());
            let id = 64;

            sc.register({
                entityType: Album,
                loadOne: (q: Query.ByKey<Album>) => Promise.resolve(new Album({ id: q.key }))
            });

            let map = await sc.execute(new Query.ByKey({
                entityType: Album,
                key: id
            }));

            let loaded = Array.from(map.values());

            expect(loaded[0]).toBeDefined();
            expect(loaded[0].id).toBe(id);
            done();
        });

        it("should execute Query.ByKeys and return expected payload", async (done) => {
            let sc = new ServiceCluster(new Workspace());
            let ids = [64, 32];

            sc.register({
                entityType: Album,
                loadMany: (q: Query.ByKeys<Album>) => Promise.resolve(q.keys.map(k => new Album({ id: k })))
            });

            let map = await sc.execute(new Query.ByKeys({
                entityType: Album,
                keys: ids
            }));

            let loaded = Array.from(map.values());

            expect(loaded.map(e => e.id)).toEqual(ids);
            done();
        });

        it("should execute Query.ByIndex and return expected payload", async (done) => {
            let sc = new ServiceCluster(new Workspace());
            let albums = [
                new Album({ id: 1, artistId: 77 }),
                new Album({ id: 2, artistId: 77 }),
                new Album({ id: 3, artistId: 77 })
            ];

            sc.register({
                entityType: Album,
                loadByIndex: (q: Query.ByIndex<Album>) => Promise.resolve(albums)
            });

            let map = await sc.execute(new Query.ByIndex({
                entityType: Album,
                index: "artistId",
                value: 77
            }));

            let loaded = Array.from(map.values());

            expect(loaded).toEqual(albums);
            done();
        });

        it("should execute Query.ByIndexes and return expected payload", async (done) => {
            let sc = new ServiceCluster(new Workspace());
            let expected = new Album({ id: 1, artistId: 77, name: "khaz" });
            let albums = [
                expected,
                new Album({ id: 2, artistId: 77, name: "mo" }),
                new Album({ id: 3, artistId: 77, name: "dan" })
            ];

            sc.register({
                entityType: Album,
                loadByIndexes: (q: Query.ByIndexes<Album>) => Promise.resolve(albums)
            });

            let map = await sc.execute(new Query.ByIndexes({
                entityType: Album,
                indexes: {
                    artistId: 77,
                    name: "khaz"
                }
            }));

            let loaded = Array.from(map.values());

            expect(loaded).toEqual([expected]);
            done();
        });
    });
});

import {
    Expansion, ServiceCluster, Query
} from "../../src";
import {
    Album, AlbumReview,
    Artist,
    Review,
    Song, SongTag
} from "../common/entities";

describe("service-cluster", () => {
    describe("execute()", () => {
        it("should throw if required query executer has not been registered yet", async (done) => {
            let sc = new ServiceCluster();

            try {
                await sc.executeQuery(new Query.All({ entityType: Album }));
                fail("expected to throw");
                done();
            } catch (error) {
                done();
            }
        });

        // todo: fix (its because of Aliases @ Song etc.)
        xit("should not load from service due being loaded as an expansion", async (done) => {
            let sc = new ServiceCluster();
            let album = new Album({
                id: 1,
                artistId: 7,
                songs: [
                    new Song({ id: 1337, albumId: 1 }),
                    new Song({ id: 64, albumId: 1 }),
                    new Song({
                        id: 32, albumId: 1, tags: [
                            new SongTag({
                                id: 777,
                                songId: 32
                            })
                        ]
                    })
                ],
                artist: new Artist({
                    id: 7
                })
            });
            sc.register(Album, { loadOne: () => Promise.resolve(album) });
            sc.register(Artist, { loadOne: () => { throw ("expected to not call Artist query executer"); } });
            sc.register(Song, { loadOne: () => { throw ("expected to not call Song query executer"); } });
            sc.register(SongTag, { loadOne: () => { throw ("expected to not call SongTag query executer"); } });

            try {
                await sc.executeQuery(new Query.ById({ entityType: Album, id: 1, expand: `artist,songs/tags` }));
                await sc.executeQuery(new Query.ById({ entityType: Song, id: 1337 }));
                await sc.executeQuery(new Query.ById({ entityType: Song, id: 64 }));
                await sc.executeQuery(new Query.ById({ entityType: Song, id: 32, expand: `tags` }));
                await sc.executeQuery(new Query.ById({ entityType: Artist, id: 7 }));
                await sc.executeQuery(new Query.ById({ entityType: SongTag, id: 777 }));
                done();
            } catch (error) {
                fail(error);
                done();
            }
        });

        it("should execute Query.All and return expected payload", async (done) => {
            let sc = new ServiceCluster();
            let albums = [new Album({ id: 1 }), new Album({ id: 2 })];
            let loaded: any[] = [];

            sc.register(
                Album,
                {
                    loadAll: () => Promise.resolve(albums)
                });

            try {
                let map = await sc.executeQuery(new Query.All({
                    entityType: Album
                }));

                loaded = Array.from(map.values());
                expect(loaded).toEqual(albums);
                done();
            } catch (error) {
                fail(error);
                done();
            }
        });

        it("should execute Query.ByKey and return expected payload", async (done) => {
            let sc = new ServiceCluster();
            let id = 64;
            let loaded: any[] = [];

            sc.register(
                Album,
                {
                    loadOne: (q: Query.ById<Album>) => Promise.resolve(new Album({ id: q.id as number }))
                });

            try {
                let map = await sc.executeQuery(new Query.ById({
                    entityType: Album,
                    id: id
                }));

                loaded = Array.from(map.values());

                expect(loaded[0]).toBeDefined();
                expect(loaded[0].id).toBe(id);
                done();
            } catch (error) {
                fail(error);
                done();
            }
        });

        it("should execute Query.ByKeys and return expected payload", async (done) => {
            let sc = new ServiceCluster();
            let ids = [64, 32];
            let loaded: any[] = [];

            sc.register(
                Album,
                {
                    loadMany: (q: Query.ByIds<Album>) => Promise.resolve(q.ids.map(k => new Album({ id: k as number })))
                });

            try {
                let map = await sc.executeQuery(new Query.ByIds({
                    entityType: Album,
                    ids: ids
                }));

                loaded = Array.from(map.values());
                expect(loaded.map(e => e.id)).toEqual(ids);
                done();
            } catch (error) {
                fail(error);
                done();
            }
        });

        it("should execute Query.ByIndexes and return expected payload", async (done) => {
            let sc = new ServiceCluster();
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
                    loadByIndexes: () => Promise.resolve(albums)
                });

            try {
                let map = await sc.executeQuery(new Query.ByIndexes({
                    entityType: Album,
                    indexes: {
                        artistId: 77,
                        name: "khaz"
                    }
                }));

                loaded = Array.from(map.values());
                expect(loaded).toEqual([expected]);
                done();
            } catch (error) {
                fail(error);
                done();
            }
        });

        it("should throw if a query executer for hydration is missing", async (done) => {
            let sc = new ServiceCluster();

            sc.register(
                Album,
                {
                    loadAll: () => Promise.resolve([new Album({ id: 1 })])
                });

            try {
                await sc.executeQuery(new Query.All({
                    entityType: Album,
                    expand: Expansion.parse(Album, `reviews`)
                }));

                fail("expected to throw");
                done();
            } catch (error) {
                done();
            }
        });

        it("should hydrate a virtual collection", async (done) => {
            let sc = new ServiceCluster();
            let album = new Album({ id: 1 });
            let review = new AlbumReview({ id: 64, albumId: 1, album: album });
            album.reviews = [review];
            let albumMap = new Map<any, Album>();

            sc.register(Album, { loadAll: () => Promise.resolve([new Album({ id: 1 })]) });
            sc.register(AlbumReview, { loadByIndexes: () => Promise.resolve([new AlbumReview({ id: 64, albumId: 1 })]) });

            try {
                let loaded = await sc.executeQuery(new Query.All({
                    entityType: Album,
                    expand: Expansion.parse(Album, `reviews`)
                }));

                loaded.forEach(i => albumMap.set(i.id, i));

                expect(albumMap.get(1).reviews[0]).toEqual(review);
                done();
            } catch (error) {
                fail(error);
                done();
            }
        });

        it("should hydrate a virtual reference of a collection navigation", async (done) => {
            let sc = new ServiceCluster();
            let artist = new Artist({ id: 7 });
            let album = new Album({ id: 1, artistId: artist.id });
            let albumReview = new AlbumReview({ id: 64, albumId: album.id });

            artist.albums = [album];
            album.artist = artist;
            album.reviews = [albumReview];
            albumReview.album = album;

            sc.register(Artist, { loadAll: () => Promise.resolve([artist]) });
            sc.register(Album, { loadByIndexes: () => Promise.resolve([album]) });
            sc.register(AlbumReview, { loadByIndexes: () => Promise.resolve([albumReview]) });

            try {
                let artistMap = new Map<number, Artist>();
                let loaded = await sc.executeQuery(new Query.All({
                    entityType: Artist,
                    expand: Expansion.parse(Artist, `albums/reviews`)
                }));

                loaded.forEach(i => artistMap.set(i.id, i));

                expect(artistMap.get(artist.id).albums[0].reviews[0]).toEqual(albumReview);
                done();
            } catch (error) {
                fail(error);
                done();
            }
        });

        it("should hydrate a virtual reference of a virtual collection", async (done) => {
            let sc = new ServiceCluster();
            let artist = new Artist({ id: 7 });
            let album = new Album({ id: 1, artistId: artist.id });
            let review = new Review({ id: "#moo", systemId: 8 });
            let albumReview = new AlbumReview({ id: 64, albumId: album.id, reviewExternalId: review.id, systemId: review.systemId });

            // we only have to connect these two together since review & albumReview are virtual
            artist.albums = [album];

            sc.register(Artist, { loadAll: () => Promise.resolve([artist]) });
            sc.register(Album, { loadByIndexes: () => Promise.resolve([album]) });
            sc.register(AlbumReview, { loadByIndexes: () => Promise.resolve([albumReview]) });
            sc.register(Review, { loadOne: () => Promise.resolve(review) });

            try {
                let artistMap = new Map<number, Artist>();
                let loaded = await sc.executeQuery(new Query.All({
                    entityType: Artist,
                    expand: Expansion.parse(Artist, `albums/reviews/review`)
                }));

                loaded.forEach(i => artistMap.set(i.id, i));

                expect(artistMap.get(artist.id).albums[0].reviews[0].review).toEqual(review);
                done();
            } catch (error) {
                fail(error);
                done();
            }
        });
    });
});

import { Query, Identities } from "../elements";
import { EntityClass, Property } from "../metadata";
import { ServiceCluster } from "./service-cluster";
import { Album, AlbumReview, Artist, Review, Song, SongTag } from "../../test/facade";

function loadHelper<V>(q: Query<V>, expected: Identities, payload: V[]): Promise<V[]> {
    if (q.identity.type == expected) return Promise.resolve(payload);
    throw new Error(`[${q.identity.type}] was not [${expected}]`);
}

describe("service-cluster", () => {
    @EntityClass()
    class Item {
        constructor(args?: Partial<Item>) { Object.assign(this, args || {}); }
        @Property.Id() id: number;
    }

    it("should not load more than once from service due to being cached", async done => {
        let sc = new ServiceCluster();
        let items = [new Item({ id: 1 }), new Item({ id: 2 })];
        let numLoadCalled = 0;

        sc.register(
            Item,
            {
                load: () => {
                    numLoadCalled++;
                    return Promise.resolve(items);
                }
            });

        try {
            await sc.loadAll(Item);
            await sc.loadAll(Item);
            await sc.loadAll(Item);

            expect(numLoadCalled).toEqual(1);
        } catch (error) {
            fail(error);
        }

        done();
    });

    it("should return by value, not by reference", async done => {
        let sc = new ServiceCluster();
        let items = [new Item({ id: 1 }), new Item({ id: 2 })];

        sc.register(Item, { load: () => Promise.resolve(items) });

        try {
            let loaded = await sc.loadAll(Item);

            loaded.forEach((item, i) => {
                expect(item).not.toBe(items[i]);
                expect(item).toEqual(items[i]);
            });
        } catch (error) {
            fail(error);
        }

        done();
    });

    describe("execute()", () => {
        it("should throw if required service has not been registered yet", async (done) => {
            let sc = new ServiceCluster();

            try {
                await sc.executeQuery(Query.All({ entity: Album }));
                fail("expected to throw");
                done();
            } catch (error) {
                done();
            }
        });

        // todo: fix (its because of Aliases @ Song etc.)
        it("should not load from service due being loaded as an expansion", async (done) => {
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

            sc.register(Album, { load: q => loadHelper(q, "ids", [album]) });
            sc.register(Artist, { load: () => { throw ("expected to not call Artist query executer"); } });
            sc.register(Song, { load: () => { throw ("expected to not call Song query executer"); } });
            sc.register(SongTag, { load: () => { throw ("expected to not call SongTag query executer"); } });

            try {
                await sc.executeQuery(Query.ByIds({ ids: [1], entity: Album, expand: `artist,songs/tags` }));
                await sc.executeQuery(Query.ByIds({ ids: [1337], entity: Song }));
                await sc.executeQuery(Query.ByIds({ ids: [64], entity: Song, }));
                await sc.executeQuery(Query.ByIds({ ids: [32], entity: Song, expand: `tags` }));
                await sc.executeQuery(Query.ByIds({ ids: [7], entity: Artist }));
                await sc.executeQuery(Query.ByIds({ ids: [777], entity: SongTag }));
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
                    load: q => loadHelper(q, "all", albums)
                });

            try {
                let map = await sc.executeQuery(Query.All({ entity: Album }));

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
            let album = new Album({ id: id });
            let loaded: any[] = [];

            sc.register(
                Album,
                {
                    load: q => loadHelper(q, "ids", [album])
                });

            try {
                let map = await sc.executeQuery(Query.ByIds({
                    ids: [id],
                    entity: Album,
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
            let albums = ids.map(k => new Album({ id: k as number }));
            let loaded: any[] = [];

            sc.register(
                Album,
                {
                    load: q => loadHelper(q, "ids", albums)
                });

            try {
                let map = await sc.executeQuery(Query.ByIds({
                    ids: ids,
                    entity: Album
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
                    load: q => loadHelper(q, "indexes", albums)
                });

            try {
                let map = await sc.executeQuery(Query.ByIndexes({
                    indexes: { artistId: 77, name: "khaz" },
                    entity: Album
                }));

                loaded = Array.from(map.values());
                expect(loaded).toEqual([expected]);
                done();
            } catch (error) {
                fail(error);
                done();
            }
        });

        it("should throw if a service for hydration is missing", async (done) => {
            let sc = new ServiceCluster();
            let album = new Album({ id: 1 });

            sc.register(
                Album,
                {
                    load: q => loadHelper(q, "all", [album])
                });

            try {
                await sc.executeQuery(Query.All({ entity: Album, expand: "reviews" }));
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

            sc.register(Album, { load: q => loadHelper(q, "all", [new Album({ id: 1 })]) });
            sc.register(AlbumReview, { load: q => loadHelper(q, "indexes", [new AlbumReview({ id: 64, albumId: 1 })]) });

            try {
                let loaded = await sc.executeQuery(Query.All({ entity: Album, expand: "reviews" }));

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

            sc.register(Artist, { load: q => loadHelper(q, "all", [artist]) });
            sc.register(Album, { load: q => loadHelper(q, "indexes", [album]) });
            sc.register(AlbumReview, { load: q => loadHelper(q, "indexes", [albumReview]) });

            try {
                let artistMap = new Map<number, Artist>();
                let loaded = await sc.executeQuery(Query.All({
                    entity: Artist,
                    expand: "albums/reviews"
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

            sc.register(Artist, { load: q => loadHelper(q, "all", [artist]) });
            sc.register(Album, { load: q => loadHelper(q, "indexes", [album]) });
            sc.register(AlbumReview, { load: q => loadHelper(q, "indexes", [albumReview]) });
            sc.register(Review, { load: q => loadHelper(q, "ids", [review]) });

            try {
                let artistMap = new Map<number, Artist>();
                let loaded = await sc.executeQuery(Query.All({
                    entity: Artist,
                    expand: "albums/reviews/review"
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

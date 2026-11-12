import {
    Album,
    AlbumBlueprint,
    Artist,
    ArtistBlueprint,
    Song,
    SongBlueprint,
    TagBlueprint,
} from "@entity-space/elements/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { EntityWorkspace } from "../../../entity-workspace";
import { EntityMutationError } from "../../../mutation/structures/entity-mutation-error";
import {
    allDispatchedNames,
    dispatched,
    dispatchedNames,
    EntityMutatorType,
    MusicBackend,
    MutatorOptions,
    TestFacade,
} from "../../../testing";

describe("prepareDelete()", () => {
    let facade: TestFacade;
    let workspace: EntityWorkspace;
    let backend: MusicBackend;

    const song = (name: string, patch: Partial<Song> = {}): Song =>
        facade.construct(SongBlueprint, { namespace: "dev", name, ...patch });
    const artist = (name: string, patch: Partial<Artist> = {}): Artist =>
        facade.construct(ArtistBlueprint, { namespace: "dev", name, ...patch });
    const album = (name: string, patch: Partial<Album> = {}): Album =>
        facade.construct(AlbumBlueprint, { namespace: "dev", name, ...patch });

    beforeEach(() => {
        facade = new TestFacade();
        workspace = facade.getWorkspace();
        backend = new MusicBackend(facade.getServices());
    });

    describe("songs without relations", () => {
        describe.each<[string, MutatorOptions<Song>]>([
            ["a batch delete mutator", {}],
            ["a one-entity delete mutator", { one: true }],
        ])("using %s", (_, options) => {
            it("should plan one delete per song without calling the mutator", () => {
                // arrange
                const del = backend.useSongs(EntityMutatorType.Delete, options);
                const songs = [song("A", { id: 1 }), song("B", { id: 2 })];

                // act
                const changeset = workspace.in(SongBlueprint).prepareDelete(songs);

                // assert
                expect(changeset.getItems().map(item => [item.type, item.entity.name, item.previous?.id])).toEqual([
                    ["delete", "A", 1],
                    ["delete", "B", 2],
                ]);
                expect(del).not.toHaveBeenCalled();
            });

            it("should delete the songs", async () => {
                // arrange
                const del = backend.useSongs(EntityMutatorType.Delete, options);
                const songs = [song("A", { id: 1 }), song("B", { id: 2 })];
                const songsBefore = structuredClone(songs);

                // act
                const changeset = workspace.in(SongBlueprint).prepareDelete(songs);
                const summary = await changeset.execute();

                // assert
                expect(summary.status).toEqual("succeeded");
                expect(allDispatchedNames(del)).toEqual(["A", "B"]);
                expect(changeset.getNext()).toEqual([]);
                expect(changeset.getPrevious()).toEqual([]);
                expect(songs).toEqual(songsBefore);
            });

            it("should keep songs that failed to be deleted as previous and only retry those", async () => {
                // arrange
                const del = backend.useSongs(EntityMutatorType.Delete, options);
                backend.rejectName("B");
                const changeset = workspace
                    .in(SongBlueprint)
                    .prepareDelete([song("A", { id: 1 }), song("B", { id: 2 }), song("C", { id: 3 })]);

                // act
                const first = await changeset.execute();
                const previousAfterFirst = changeset.getPrevious();
                backend.clearRejections();
                const second = await changeset.execute();

                // assert
                expect(first.status).toEqual("partial");
                expect(first.failed.map(item => [item.entity.name, item.error])).toEqual([
                    ["B", new Error('name "B" is not allowed')],
                ]);
                expect(first.failed[0].errorPath).toEqual(options.one ? undefined : "name");
                expect(previousAfterFirst.map(song => song.name)).toEqual(["B"]);

                expect(second.status).toEqual("succeeded");
                expect(allDispatchedNames(del)).toEqual(["A", "B", "C", "B"]);
                expect(changeset.getPrevious()).toEqual([]);
            });
        });

        it("should accept a single song instead of an array", async () => {
            // arrange
            const del = backend.useSongs(EntityMutatorType.Delete);

            // act
            const summary = await workspace
                .in(SongBlueprint)
                .prepareDelete(song("A", { id: 1 }))
                .execute();

            // assert
            expect(summary.status).toEqual("succeeded");
            expect(dispatchedNames(del)).toEqual([["A"]]);
        });

        it("should fail all songs of a batch if the mutator throws", async () => {
            // arrange
            const del = backend.useSongs(EntityMutatorType.Delete);
            del.mockRejectedValueOnce(new Error("service unavailable"));

            // act
            const changeset = workspace.in(SongBlueprint).prepareDelete([song("A", { id: 1 }), song("B", { id: 2 })]);
            const summary = await changeset.execute();

            // assert
            expect(summary.status).toEqual("failed");
            expect(summary.failed.map(item => item.error)).toEqual([
                new Error("service unavailable"),
                new Error("service unavailable"),
            ]);
            expect(changeset.getPrevious().map(song => song.name)).toEqual(["A", "B"]);
        });

        it.each<[string, () => void]>([
            ["no mutator exists", () => {}],
            ["only a save mutator exists", () => backend.useSongs(EntityMutatorType.Save)],
            ["only a delete mutator for artists exists", () => backend.useArtists(EntityMutatorType.Delete)],
        ])("should throw if %s", (_, useMutators) => {
            // arrange
            useMutators();

            // act & assert
            expect(() => workspace.in(SongBlueprint).prepareDelete([song("A", { id: 1 })])).toThrow(
                /not all mutations have been accepted/,
            );
        });

        it("should throw an EntityMutationError from the delete() shortcut and allow retrying", async () => {
            // arrange
            backend.useSongs(EntityMutatorType.Delete);
            backend.rejectName("B");

            // act
            const error = await workspace
                .in(SongBlueprint)
                .delete([song("A", { id: 1 }), song("B", { id: 2 })])
                .catch(error => error);
            backend.clearRejections();
            const retried = await (error as EntityMutationError).changeset.execute();

            // assert
            expect(error).toBeInstanceOf(EntityMutationError);
            expect((error as EntityMutationError).summary.failed.map(item => item.entity.name)).toEqual(["B"]);
            expect(retried.status).toEqual("succeeded");
        });
    });

    describe("artists with their songs (inbound relation)", () => {
        const select = { songs: true } as const;

        const input = () => [
            artist("Sunnexo", { id: 7, songs: [song("A", { id: 1, artistId: 7 }), song("B", { id: 2, artistId: 7 })] }),
            artist("Mono", { id: 8, songs: [song("C", { id: 3, artistId: 8 })] }),
        ];

        describe.each<[string, MutatorOptions<Song>, MutatorOptions<Artist>]>([
            ["batch delete mutators", {}, {}],
            ["one-entity delete mutators", { one: true }, { one: true }],
            ["a batch delete mutator for songs and a one-entity one for artists", {}, { one: true }],
        ])("using %s for artists and songs", (_, songOptions, artistOptions) => {
            it("should delete the songs before their artists", async () => {
                // arrange
                const songs = backend.useSongs(EntityMutatorType.Delete, songOptions);
                const artists = backend.useArtists(EntityMutatorType.Delete, artistOptions);

                // act
                const changeset = workspace.in(ArtistBlueprint).select(select).prepareDelete(input());
                const summary = await changeset.execute();

                // assert
                expect(summary.status).toEqual("succeeded");
                expect(allDispatchedNames(songs)).toEqual(["A", "B", "C"]);
                expect(allDispatchedNames(artists)).toEqual(["Sunnexo", "Mono"]);
                expect(songs).toHaveBeenCalledBefore(artists);
                expect(
                    dispatched<Artist>(artists)
                        .flat()
                        .map(artist => artist.songs),
                ).toEqual([undefined, undefined]);
                expect(changeset.getPrevious()).toEqual([]);
            });

            it("should only block the artist whose song failed to be deleted", async () => {
                // arrange
                backend.useSongs(EntityMutatorType.Delete, songOptions);
                const artists = backend.useArtists(EntityMutatorType.Delete, artistOptions);
                backend.rejectName("B");

                // act
                const changeset = workspace.in(ArtistBlueprint).select(select).prepareDelete(input());
                const summary = await changeset.execute();

                // assert
                expect(summary.status).toEqual("partial");
                expect(summary.items.map(item => [item.entity.name, item.status])).toEqual(
                    expect.arrayContaining([
                        ["A", "succeeded"],
                        ["B", "failed"],
                        ["C", "succeeded"],
                        ["Sunnexo", "blocked"],
                        ["Mono", "succeeded"],
                    ]),
                );
                expect(allDispatchedNames(artists)).toEqual(["Mono"]);
                expect(changeset.getPrevious()).toEqual([
                    expect.objectContaining({ name: "Sunnexo", songs: [expect.objectContaining({ name: "B" })] }),
                ]);
            });

            it("should delete the remaining song and its artist on retry", async () => {
                // arrange
                const songs = backend.useSongs(EntityMutatorType.Delete, songOptions);
                const artists = backend.useArtists(EntityMutatorType.Delete, artistOptions);
                backend.rejectName("B");
                const changeset = workspace.in(ArtistBlueprint).select(select).prepareDelete(input());
                await changeset.execute();
                backend.clearRejections();
                songs.mockClear();
                artists.mockClear();

                // act
                const summary = await changeset.execute();

                // assert
                expect(summary.status).toEqual("succeeded");
                expect(allDispatchedNames(songs)).toEqual(["B"]);
                expect(allDispatchedNames(artists)).toEqual(["Sunnexo"]);
                expect(changeset.getPrevious()).toEqual([]);
            });
        });

        describe.each<[string, MutatorOptions<Artist>]>([
            ["a batch delete mutator for artists that includes songs", { select }],
            ["a one-entity delete mutator for artists that includes songs", { select, one: true }],
        ])("using %s", (_, options) => {
            it("should dispatch the artists together with their songs", async () => {
                // arrange
                const artists = backend.useArtists(EntityMutatorType.Delete, options);

                // act
                const changeset = workspace.in(ArtistBlueprint).select(select).prepareDelete(input());
                const summary = await changeset.execute();

                // assert
                expect(summary.status).toEqual("succeeded");
                expect(
                    dispatched<Artist>(artists)
                        .flat()
                        .map(artist => [artist.name, artist.songs?.map(song => song.name)]),
                ).toEqual([
                    ["Sunnexo", ["A", "B"]],
                    ["Mono", ["C"]],
                ]);
                expect(changeset.getPrevious()).toEqual([]);
            });

            it("should keep a song the backend refused to delete, while its artist is deleted", async () => {
                // arrange
                backend.useArtists(EntityMutatorType.Delete, options);
                backend.rejectName("B");

                // act
                const changeset = workspace.in(ArtistBlueprint).select(select).prepareDelete(input());
                const summary = await changeset.execute();

                // assert
                expect(summary.status).toEqual("partial");
                expect(summary.failed.map(item => item.entity.name)).toEqual(["B"]);
            });
        });

        it("should prefer a delete mutator for artists including songs over separate mutators if registered first", async () => {
            // arrange
            const aggregate = backend.useArtists(EntityMutatorType.Delete, { select });
            const songs = backend.useSongs(EntityMutatorType.Delete);
            const artists = backend.useArtists(EntityMutatorType.Delete);

            // act
            await workspace.in(ArtistBlueprint).select(select).prepareDelete(input()).execute();

            // assert
            expect(aggregate).toHaveBeenCalledTimes(1);
            expect(songs).not.toHaveBeenCalled();
            expect(artists).not.toHaveBeenCalled();
        });

        it("should throw if the artist delete mutator does not include songs and no song delete mutator exists", () => {
            // arrange
            backend.useArtists(EntityMutatorType.Delete);

            // act & assert
            expect(() => workspace.in(ArtistBlueprint).select(select).prepareDelete(input())).toThrow(
                /not all mutations have been accepted/,
            );
        });

        it("should only delete the artists if the songs are not selected", async () => {
            // arrange
            const songs = backend.useSongs(EntityMutatorType.Delete);
            const artists = backend.useArtists(EntityMutatorType.Delete);

            // act
            await workspace.in(ArtistBlueprint).prepareDelete(input()).execute();

            // assert
            expect(songs).not.toHaveBeenCalled();
            expect(allDispatchedNames(artists)).toEqual(["Sunnexo", "Mono"]);
        });

        it("should only delete the artists if their songs are not loaded", async () => {
            // arrange
            const songs = backend.useSongs(EntityMutatorType.Delete);
            const artists = backend.useArtists(EntityMutatorType.Delete);

            // act
            const summary = await workspace
                .in(ArtistBlueprint)
                .select(select)
                .prepareDelete([artist("Sunnexo", { id: 7 })])
                .execute();

            // assert
            expect(summary.status).toEqual("succeeded");
            expect(songs).not.toHaveBeenCalled();
            expect(dispatchedNames(artists)).toEqual([["Sunnexo"]]);
        });
    });

    describe("songs with their artist and album (outbound relations)", () => {
        it("should not delete the artist or album of a deleted song", async () => {
            // arrange
            const songs = backend.useSongs(EntityMutatorType.Delete);
            const artists = backend.useArtists(EntityMutatorType.Delete);
            const albums = backend.useAlbums(EntityMutatorType.Delete);

            // act
            const summary = await workspace
                .in(SongBlueprint)
                .select({ artist: true, album: true })
                .prepareDelete([
                    song("A", {
                        id: 1,
                        artistId: 7,
                        artist: artist("Sunnexo", { id: 7 }),
                        albumId: 9,
                        album: album("Album", { id: 9 }),
                    }),
                ])
                .execute();

            // assert
            expect(summary.items.map(item => [item.schema.getName(), item.type])).toEqual([["songs", "delete"]]);
            expect(dispatchedNames(songs)).toEqual([["A"]]);
            expect(artists).not.toHaveBeenCalled();
            expect(albums).not.toHaveBeenCalled();
        });

        it("should not require mutators for the artist or album of a deleted song", async () => {
            // arrange
            backend.useSongs(EntityMutatorType.Delete);

            // act
            const summary = await workspace
                .in(SongBlueprint)
                .select({ artist: true })
                .prepareDelete([song("A", { id: 1, artistId: 7, artist: artist("Sunnexo", { id: 7 }) })])
                .execute();

            // assert
            expect(summary.status).toEqual("succeeded");
        });
    });

    describe("albums with their songs and the tags of those songs (nested relations)", () => {
        it("should delete the songs of an album, but not the tags of those songs", async () => {
            // arrange
            const songs = backend.useSongs(EntityMutatorType.Delete);
            const albums = backend.useAlbums(EntityMutatorType.Delete);
            const tags = backend.useTags(EntityMutatorType.Delete);

            // act
            const changeset = workspace
                .in(AlbumBlueprint)
                .select({ songs: { tags: true } })
                .prepareDelete([
                    album("Album", {
                        id: 9,
                        songs: [
                            song("A", {
                                id: 1,
                                albumId: 9,
                                tagIds: ["rock"],
                                tags: [facade.construct(TagBlueprint, { id: "rock", name: "Rock" })],
                            }),
                        ],
                    }),
                ]);
            const summary = await changeset.execute();

            // assert
            expect(summary.status).toEqual("succeeded");
            expect(dispatchedNames(songs)).toEqual([["A"]]);
            expect(dispatchedNames(albums)).toEqual([["Album"]]);
            expect(songs).toHaveBeenCalledBefore(albums);
            expect(tags).not.toHaveBeenCalled();
        });
    });
});

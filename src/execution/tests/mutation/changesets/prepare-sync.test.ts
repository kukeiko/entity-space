import { Artist, ArtistBlueprint, Song, SongBlueprint } from "@entity-space/elements/testing";
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

describe("prepareSync()", () => {
    let facade: TestFacade;
    let workspace: EntityWorkspace;
    let backend: MusicBackend;

    const song = (name: string, patch: Partial<Song> = {}): Song =>
        facade.construct(SongBlueprint, { namespace: "dev", name, ...patch });
    const artist = (name: string, patch: Partial<Artist> = {}): Artist =>
        facade.construct(ArtistBlueprint, { namespace: "dev", name, ...patch });

    beforeEach(() => {
        facade = new TestFacade();
        workspace = facade.getWorkspace();
        backend = new MusicBackend(facade.getServices());
    });

    describe("songs without relations", () => {
        let previous: Song[];
        let next: Song[];

        beforeEach(() => {
            previous = [song("kept", { id: 1 }), song("changed", { id: 2 }), song("removed", { id: 3 })];
            next = [song("kept", { id: 1 }), song("changed*", { id: 2 }), song("added")];
        });

        describe.each<
            [
                string,
                () => { upsert: ReturnType<MusicBackend["useSongs"]>[]; del: ReturnType<MusicBackend["useSongs"]> },
            ]
        >([
            [
                "batch create, update and delete mutators",
                () => ({
                    upsert: [backend.useSongs(EntityMutatorType.Create), backend.useSongs(EntityMutatorType.Update)],
                    del: backend.useSongs(EntityMutatorType.Delete),
                }),
            ],
            [
                "one-entity create, update and delete mutators",
                () => ({
                    upsert: [
                        backend.useSongs(EntityMutatorType.Create, { one: true }),
                        backend.useSongs(EntityMutatorType.Update, { one: true }),
                    ],
                    del: backend.useSongs(EntityMutatorType.Delete, { one: true }),
                }),
            ],
            [
                "batch save and delete mutators",
                () => ({
                    upsert: [backend.useSongs(EntityMutatorType.Save)],
                    del: backend.useSongs(EntityMutatorType.Delete),
                }),
            ],
            [
                "one-entity save and delete mutators",
                () => ({
                    upsert: [backend.useSongs(EntityMutatorType.Save, { one: true })],
                    del: backend.useSongs(EntityMutatorType.Delete, { one: true }),
                }),
            ],
        ])("using %s", (_, useMutators) => {
            it("should plan creates, updates and deletes of root songs", () => {
                // arrange
                useMutators();

                // act
                const changeset = workspace.in(SongBlueprint).prepareSync(next, previous);

                // assert
                expect(changeset.getItems().map(item => [item.type, item.entity.name])).toEqual(
                    expect.arrayContaining([
                        ["create", "added"],
                        ["update", "changed*"],
                        ["delete", "removed"],
                    ]),
                );
                expect(changeset.getItems()).toHaveLength(3);
                expect(changeset.getItems().find(item => item.type === "delete")?.previous).toEqual(
                    expect.objectContaining({ id: 3, name: "removed" }),
                );
            });

            it("should create, update and delete root songs", async () => {
                // arrange
                const mutators = useMutators();

                // act
                const changeset = workspace.in(SongBlueprint).prepareSync(next, previous);
                const summary = await changeset.execute();

                // assert
                expect(summary.status).toEqual("succeeded");
                expect(mutators.upsert.flatMap(allDispatchedNames).sort()).toEqual(["added", "changed*"]);
                expect(allDispatchedNames(mutators.del)).toEqual(["removed"]);
                expect(changeset.getNext().map(song => [song.id, song.name])).toEqual([
                    [1, "kept"],
                    [2, "changed*"],
                    [301, "added"],
                ]);
                expect(changeset.getPrevious().map(song => [song.id, song.name])).toEqual([
                    [1, "kept"],
                    [2, "changed*"],
                    [301, "added"],
                ]);
            });

            it("should keep a song that failed to be deleted as previous and retry deleting it", async () => {
                // arrange
                const mutators = useMutators();
                backend.rejectName("removed", [EntityMutatorType.Delete]);
                const changeset = workspace.in(SongBlueprint).prepareSync(next, previous);

                // act
                const first = await changeset.execute();
                const previousAfterFirst = changeset.getPrevious();
                backend.clearRejections();
                const second = await changeset.execute();

                // assert
                expect(first.status).toEqual("partial");
                expect(first.failed.map(item => [item.type, item.entity.name])).toEqual([["delete", "removed"]]);
                expect(previousAfterFirst.map(song => song.name)).toEqual(
                    expect.arrayContaining(["kept", "changed*", "added", "removed"]),
                );
                expect(previousAfterFirst).toHaveLength(4);

                expect(second.status).toEqual("succeeded");
                expect(second.items.map(item => [item.type, item.entity.name])).toEqual([["delete", "removed"]]);
                expect(allDispatchedNames(mutators.del)).toEqual(["removed", "removed"]);
                expect(mutators.upsert.flatMap(allDispatchedNames).sort()).toEqual(["added", "changed*"]);
                expect(changeset.getPrevious().map(song => song.name)).toEqual(["kept", "changed*", "added"]);
            });
        });

        it("should throw if no delete mutator exists for removed songs", () => {
            // arrange
            backend.useSongs(EntityMutatorType.Save);

            // act & assert
            expect(() => workspace.in(SongBlueprint).prepareSync(next, previous)).toThrow(
                /not all mutations have been accepted/,
            );
        });

        it("should not need a delete mutator if no song was removed", async () => {
            // arrange
            const save = backend.useSongs(EntityMutatorType.Save);

            // act
            const summary = await workspace
                .in(SongBlueprint)
                .prepareSync([...next, previous[2]], previous)
                .execute();

            // assert
            expect(summary.status).toEqual("succeeded");
            expect(allDispatchedNames(save)).toEqual(["changed*", "added"]);
        });

        it("should delete all songs if next is empty", async () => {
            // arrange
            const del = backend.useSongs(EntityMutatorType.Delete);

            // act
            const changeset = workspace.in(SongBlueprint).prepareSync([], previous);
            await changeset.execute();

            // assert
            expect(dispatchedNames(del)).toEqual([["kept", "changed", "removed"]]);
            expect(changeset.getNext()).toEqual([]);
            expect(changeset.getPrevious()).toEqual([]);
        });

        it("should not plan anything if nothing changed", async () => {
            // arrange
            const save = backend.useSongs(EntityMutatorType.Save);
            const del = backend.useSongs(EntityMutatorType.Delete);

            // act
            const summary = await workspace
                .in(SongBlueprint)
                .prepareSync(structuredClone(previous), previous)
                .execute();

            // assert
            expect(summary.items).toEqual([]);
            expect(save).not.toHaveBeenCalled();
            expect(del).not.toHaveBeenCalled();
        });

        it("should keep creating and updating songs while a delete fails", async () => {
            // arrange
            const save = backend.useSongs(EntityMutatorType.Save);
            backend.useSongs(EntityMutatorType.Delete);
            backend.rejectName("removed", [EntityMutatorType.Delete]);

            // act
            const summary = await workspace.in(SongBlueprint).prepareSync(next, previous).execute();

            // assert
            expect(summary.status).toEqual("partial");
            expect(summary.succeeded.map(item => item.entity.name).sort()).toEqual(["added", "changed*"]);
            expect(save).toHaveBeenCalledTimes(1);
        });

        it("should throw an EntityMutationError from the sync() shortcut and allow retrying", async () => {
            // arrange
            backend.useSongs(EntityMutatorType.Save);
            backend.useSongs(EntityMutatorType.Delete);
            backend.rejectName("removed", [EntityMutatorType.Delete]);

            // act
            const error = await workspace
                .in(SongBlueprint)
                .sync(next, previous)
                .catch(error => error);
            backend.clearRejections();
            const retried = await (error as EntityMutationError).changeset.execute();

            // assert
            expect(error).toBeInstanceOf(EntityMutationError);
            expect((error as EntityMutationError).summary.status).toEqual("partial");
            expect(next.map(song => song.id)).toEqual([1, 2, 301]);
            expect(retried.status).toEqual("succeeded");
        });
    });

    describe("artists with their songs (inbound relation)", () => {
        const select = { songs: true } as const;
        let previous: Artist[];

        beforeEach(() => {
            previous = [
                artist("kept", {
                    id: 7,
                    songs: [song("A", { id: 1, artistId: 7 }), song("B", { id: 2, artistId: 7 })],
                }),
                artist("removed", {
                    id: 8,
                    songs: [song("C", { id: 3, artistId: 8 }), song("D", { id: 4, artistId: 8 })],
                }),
            ];
        });

        describe.each<[string, MutatorOptions<Song>, MutatorOptions<Artist>]>([
            ["batch delete mutators", {}, {}],
            ["one-entity delete mutators", { one: true }, { one: true }],
        ])("deleting a removed artist and its songs using %s", (_, songOptions, artistOptions) => {
            it("should delete the songs before the artist", async () => {
                // arrange
                const songs = backend.useSongs(EntityMutatorType.Delete, songOptions);
                const artists = backend.useArtists(EntityMutatorType.Delete, artistOptions);

                // act
                const changeset = workspace
                    .in(ArtistBlueprint)
                    .select(select)
                    .prepareSync([structuredClone(previous[0])], previous);
                const summary = await changeset.execute();

                // assert
                expect(summary.status).toEqual("succeeded");
                expect(allDispatchedNames(songs)).toEqual(["C", "D"]);
                expect(allDispatchedNames(artists)).toEqual(["removed"]);
                expect(songs).toHaveBeenCalledBefore(artists);
                expect(dispatched<Artist>(artists)[0][0].songs).toBeUndefined();
                expect(changeset.getPrevious().map(artist => artist.name)).toEqual(["kept"]);
            });

            it("should not delete the artist if one of its songs failed to be deleted", async () => {
                // arrange
                backend.useSongs(EntityMutatorType.Delete, songOptions);
                const artists = backend.useArtists(EntityMutatorType.Delete, artistOptions);
                backend.rejectName("D", [EntityMutatorType.Delete]);

                // act
                const changeset = workspace
                    .in(ArtistBlueprint)
                    .select(select)
                    .prepareSync([structuredClone(previous[0])], previous);
                const summary = await changeset.execute();

                // assert
                expect(summary.status).toEqual("partial");
                expect(summary.items.map(item => [item.entity.name, item.status])).toEqual(
                    expect.arrayContaining([
                        ["C", "succeeded"],
                        ["D", "failed"],
                        ["removed", "blocked"],
                    ]),
                );
                expect(artists).not.toHaveBeenCalled();

                const removed = changeset.getPrevious().find(artist => artist.name === "removed");
                expect(removed?.songs?.map(song => song.name)).toEqual(["D"]);
            });
        });

        it("should dispatch a removed artist together with its songs to an artist delete mutator including songs", async () => {
            // arrange
            const artists = backend.useArtists(EntityMutatorType.Delete, { select });

            // act
            const changeset = workspace
                .in(ArtistBlueprint)
                .select(select)
                .prepareSync([structuredClone(previous[0])], previous);
            const summary = await changeset.execute();

            // assert
            expect(summary.status).toEqual("succeeded");
            expect(artists).toHaveBeenCalledTimes(1);
            expect(dispatched<Artist>(artists)[0][0].songs!.map(song => song.name)).toEqual(["C", "D"]);
            expect(changeset.getPrevious().map(artist => artist.name)).toEqual(["kept"]);
        });

        it("should only delete the artist if its songs are not selected", async () => {
            // arrange
            const songs = backend.useSongs(EntityMutatorType.Delete);
            const artists = backend.useArtists(EntityMutatorType.Delete);

            // act
            await workspace
                .in(ArtistBlueprint)
                .prepareSync([structuredClone(previous[0])], previous)
                .execute();

            // assert
            expect(songs).not.toHaveBeenCalled();
            expect(dispatchedNames(artists)).toEqual([["removed"]]);
        });

        it("should throw if the songs of a removed artist can not be deleted", () => {
            // arrange
            backend.useArtists(EntityMutatorType.Delete);

            // act & assert
            expect(() =>
                workspace
                    .in(ArtistBlueprint)
                    .select(select)
                    .prepareSync([structuredClone(previous[0])], previous),
            ).toThrow(/not all mutations have been accepted/);
        });

        it("should combine changes of kept artists with deletion of removed ones", async () => {
            // arrange
            const artists = backend.useArtists(EntityMutatorType.Save);
            const artistDeletes = backend.useArtists(EntityMutatorType.Delete);
            const songs = backend.useSongs(EntityMutatorType.Save);
            const songDeletes = backend.useSongs(EntityMutatorType.Delete);
            const kept = structuredClone(previous[0]);
            kept.name = "kept*";
            kept.songs = [kept.songs![0], song("E")];

            // act
            const changeset = workspace
                .in(ArtistBlueprint)
                .select(select)
                .prepareSync([kept, artist("added", { songs: [song("F")] })], previous);
            const summary = await changeset.execute();

            // assert
            expect(summary.status).toEqual("succeeded");
            expect(allDispatchedNames(artists).sort()).toEqual(["added", "kept*"]);
            expect(allDispatchedNames(artistDeletes)).toEqual(["removed"]);
            expect(allDispatchedNames(songs).sort()).toEqual(["E", "F"]);
            expect(allDispatchedNames(songDeletes).sort()).toEqual(["B", "C", "D"]);

            expect(changeset.getPrevious().map(artist => [artist.name, artist.songs?.map(song => song.name)])).toEqual([
                ["kept*", ["A", "E"]],
                ["added", ["F"]],
            ]);
        });

        it("should only pass removed songs of saved artists to an artist save mutator including songs", async () => {
            // arrange
            const save = backend.useArtists(EntityMutatorType.Save, { select });
            const del = backend.useArtists(EntityMutatorType.Delete, { select });
            const kept = structuredClone(previous[0]);
            kept.name = "kept*";
            kept.songs = [kept.songs![0]];

            // act
            const changeset = workspace.in(ArtistBlueprint).select(select).prepareSync([kept], previous);
            const summary = await changeset.execute();

            // assert
            expect(summary.status).toEqual("succeeded");
            expect(summary.items.map(item => [item.type, item.entity.name])).toEqual(
                expect.arrayContaining([
                    ["update", "kept*"],
                    ["delete", "B"],
                    ["delete", "removed"],
                    ["delete", "C"],
                    ["delete", "D"],
                ]),
            );
            expect(dispatched<Artist>(save)).toEqual([
                [expect.objectContaining({ name: "kept*", songs: [expect.objectContaining({ name: "A" })] })],
            ]);
            expect(dispatched<Artist>(del)[0][0].songs!.map(song => song.name)).toEqual(["C", "D"]);
            expect(changeset.getPrevious().map(artist => [artist.name, artist.songs?.map(song => song.name)])).toEqual([
                ["kept*", ["A"]],
            ]);
        });

        it("should replace all artists using save and delete mutators for artists that include songs", async () => {
            // arrange
            const artists = backend.useArtists(EntityMutatorType.Save, { select });
            const deletes = backend.useArtists(EntityMutatorType.Delete, { select });

            // act
            const changeset = workspace
                .in(ArtistBlueprint)
                .select(select)
                .prepareSync([artist("added", { songs: [song("F")] })], previous);
            const summary = await changeset.execute();

            // assert
            expect(summary.status).toEqual("succeeded");
            expect(dispatchedNames(artists)).toEqual([["added"]]);
            expect(dispatched<Artist>(artists)[0][0].songs!.map(song => song.name)).toEqual(["F"]);
            expect(
                dispatched<Artist>(deletes)
                    .flat()
                    .map(artist => [artist.name, artist.songs?.map(song => song.name)]),
            ).toEqual([
                ["kept", ["A", "B"]],
                ["removed", ["C", "D"]],
            ]);
            expect(changeset.getNext()).toEqual([
                expect.objectContaining({ id: 101, songs: [expect.objectContaining({ id: 301, artistId: 101 })] }),
            ]);
            expect(changeset.getPrevious()).toEqual(changeset.getNext());
        });
    });
});

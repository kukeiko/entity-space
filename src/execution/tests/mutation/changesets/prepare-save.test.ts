import {
    Album,
    AlbumBlueprint,
    Artist,
    ArtistBlueprint,
    Song,
    SongBlueprint,
    Tag,
    TagBlueprint,
} from "@entity-space/elements/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { EntityWorkspace } from "../../../entity-workspace";
import {
    allDispatchedNames,
    dispatched,
    dispatchedNames,
    MusicBackend,
    MutatorOptions,
    MutatorType,
    TestFacade,
} from "../../../testing";

describe("prepareSave()", () => {
    let facade: TestFacade;
    let workspace: EntityWorkspace;
    let backend: MusicBackend;

    const song = (name: string, patch: Partial<Song> = {}): Song =>
        facade.construct(SongBlueprint, { namespace: "dev", name, ...patch });
    const artist = (name: string, patch: Partial<Artist> = {}): Artist =>
        facade.construct(ArtistBlueprint, { namespace: "dev", name, ...patch });
    const album = (name: string, patch: Partial<Album> = {}): Album =>
        facade.construct(AlbumBlueprint, { namespace: "dev", name, ...patch });
    const tag = (name: string, patch: Partial<Tag> = {}): Tag => facade.construct(TagBlueprint, { name, ...patch });

    beforeEach(() => {
        facade = new TestFacade();
        workspace = facade.getWorkspace();
        backend = new MusicBackend(facade.getServices());
    });

    describe("songs without relations", () => {
        describe.each<[string, MutatorType, MutatorOptions<Song>]>([
            ["a batch create mutator", "create", {}],
            ["a one-entity create mutator", "create", { one: true }],
            ["a batch save mutator", "save", {}],
            ["a one-entity save mutator", "save", { one: true }],
        ])("creating new songs using %s", (_, type, options) => {
            it("should plan one create per song without calling the mutator", () => {
                // arrange
                const mutator = backend.useSongs(type, options);

                // act
                const changeset = workspace.in(SongBlueprint).prepareSave([song("A"), song("B")]);

                // assert
                expect(changeset.getItems().map(item => [item.type, item.entity.name, item.status])).toEqual([
                    ["create", "A", "pending"],
                    ["create", "B", "pending"],
                ]);
                expect(mutator).not.toHaveBeenCalled();
            });

            it("should create them and expose the created Ids without modifying the given songs", async () => {
                // arrange
                const mutator = backend.useSongs(type, options);
                const songs = [song("A"), song("B")];
                const songsBefore = structuredClone(songs);

                // act
                const changeset = workspace.in(SongBlueprint).prepareSave(songs);
                const summary = await changeset.execute();

                // assert
                expect(summary.status).toEqual("succeeded");
                expect(allDispatchedNames(mutator)).toEqual(["A", "B"]);
                expect(
                    dispatched<Song>(mutator)
                        .flat()
                        .map(song => song.id),
                ).toEqual([0, 0]);
                expect(changeset.getNext()).toEqual([
                    { ...songs[0], id: 301 },
                    { ...songs[1], id: 302 },
                ]);
                expect(changeset.getPrevious()).toEqual(changeset.getNext());
                expect(songs).toEqual(songsBefore);
            });

            it("should report songs the backend rejected and create them on retry once fixed", async () => {
                // arrange
                const mutator = backend.useSongs(type, options);
                backend.rejectName("");
                const changeset = workspace.in(SongBlueprint).prepareSave([song("A"), song("")]);

                // act
                const first = await changeset.execute();
                const [created, rejected] = changeset.getNext();
                changeset.update([created, { ...rejected, name: "B" }]);
                const second = await changeset.execute();

                // assert
                expect(first.status).toEqual("partial");
                expect(first.failed.map(item => item.error)).toEqual([new Error('name "" is not allowed')]);
                expect(first.failed[0].errorPath).toEqual(options.one ? undefined : "name");
                expect(created.id).toEqual(301);
                expect(rejected.id).toBeLessThan(0);

                expect(second.status).toEqual("succeeded");
                expect(second.items.map(item => [item.type, item.entity.name])).toEqual([["create", "B"]]);
                expect(allDispatchedNames(mutator)).toEqual(["A", "", "B"]);
                expect(changeset.getNext().map(song => [song.id, song.name])).toEqual([
                    [301, "A"],
                    [302, "B"],
                ]);
            });
        });

        it("should accept a single song instead of an array", async () => {
            // arrange
            backend.useSongs("create");

            // act
            const changeset = workspace.in(SongBlueprint).prepareSave(song("A"));
            await changeset.execute();

            // assert
            expect(changeset.getNext()).toEqual([expect.objectContaining({ id: 301, name: "A" })]);
        });

        describe.each<[string, MutatorType, MutatorOptions<Song>]>([
            ["a batch update mutator", "update", {}],
            ["a one-entity update mutator", "update", { one: true }],
            ["a batch save mutator", "save", {}],
            ["a one-entity save mutator", "save", { one: true }],
        ])("updating existing songs using %s", (_, type, options) => {
            it("should only dispatch the songs that changed compared to previous", async () => {
                // arrange
                const mutator = backend.useSongs(type, options);
                const previous = [song("A", { id: 1 }), song("B", { id: 2 })];
                const next = [song("A", { id: 1 }), song("B (Remastered)", { id: 2 })];

                // act
                const changeset = workspace.in(SongBlueprint).prepareSave(next, previous);
                const summary = await changeset.execute();

                // assert
                expect(summary.items.map(item => [item.type, item.entity.name])).toEqual([
                    ["update", "B (Remastered)"],
                ]);
                expect(summary.status).toEqual("succeeded");
                expect(dispatchedNames(mutator)).toEqual([["B (Remastered)"]]);
                expect(changeset.getPrevious()).toEqual(next);
            });

            it("should update songs without a previous", async () => {
                // arrange
                const mutator = backend.useSongs(type, options);
                const next = [song("A", { id: 1 }), song("B", { id: 2 })];

                // act
                const summary = await workspace.in(SongBlueprint).prepareSave(next).execute();

                // assert
                expect(summary.items.map(item => item.type)).toEqual(["update", "update"]);
                expect(allDispatchedNames(mutator)).toEqual(["A", "B"]);
            });

            it("should keep the previous state of songs that failed to update", async () => {
                // arrange
                backend.useSongs(type, options);
                backend.rejectName("");
                const previous = [song("A", { id: 1 }), song("B", { id: 2 })];
                const next = [song("A*", { id: 1 }), song("", { id: 2 })];

                // act
                const changeset = workspace.in(SongBlueprint).prepareSave(next, previous);
                const summary = await changeset.execute();

                // assert
                expect(summary.status).toEqual("partial");
                expect(changeset.getPrevious().map(song => song.name)).toEqual(["A*", "B"]);
                expect(changeset.getNext().map(song => song.name)).toEqual(["A*", ""]);
            });
        });

        it("should not plan anything for songs that did not change", async () => {
            // arrange
            const mutator = backend.useSongs("save");
            const songs = [song("A", { id: 1 })];

            // act
            const changeset = workspace.in(SongBlueprint).prepareSave(songs, structuredClone(songs));
            const summary = await changeset.execute();

            // assert
            expect(summary.items).toEqual([]);
            expect(summary.status).toEqual("succeeded");
            expect(mutator).not.toHaveBeenCalled();
        });

        it("should dispatch creates and updates to their respective mutators", async () => {
            // arrange
            const create = backend.useSongs("create");
            const update = backend.useSongs("update");
            const previous = [song("A", { id: 1 })];
            const next = [song("A*", { id: 1 }), song("B")];

            // act
            const summary = await workspace.in(SongBlueprint).prepareSave(next, previous).execute();

            // assert
            expect(summary.status).toEqual("succeeded");
            expect(dispatchedNames(create)).toEqual([["B"]]);
            expect(dispatchedNames(update)).toEqual([["A*"]]);
        });

        it("should dispatch creates and updates to a save mutator in one call", async () => {
            // arrange
            const save = backend.useSongs("save");
            const previous = [song("A", { id: 1 })];
            const next = [song("A*", { id: 1 }), song("B")];

            // act
            const changeset = workspace.in(SongBlueprint).prepareSave(next, previous);
            await changeset.execute();

            // assert
            expect(dispatchedNames(save)).toEqual([["A*", "B"]]);
            expect(changeset.getNext().map(song => song.id)).toEqual([1, 301]);
        });

        it("should prefer the mutator that was registered first", async () => {
            // arrange
            const create = backend.useSongs("create");
            const save = backend.useSongs("save");

            // act
            await workspace
                .in(SongBlueprint)
                .prepareSave([song("A")])
                .execute();

            // assert
            expect(create).toHaveBeenCalledTimes(1);
            expect(save).not.toHaveBeenCalled();
        });

        it("should throw if only an update mutator exists for new songs", () => {
            // arrange
            const update = backend.useSongs("update");

            // act & assert
            expect(() => workspace.in(SongBlueprint).prepareSave([song("A")])).toThrow(
                /not all mutations have been accepted/,
            );
            expect(update).not.toHaveBeenCalled();
        });

        it("should throw if only a create mutator exists for changed songs", () => {
            // arrange
            backend.useSongs("create");

            // act & assert
            expect(() =>
                workspace.in(SongBlueprint).prepareSave([song("A*", { id: 1 })], [song("A", { id: 1 })]),
            ).toThrow(/not all mutations have been accepted/);
        });

        it("should throw if no mutator exists at all", () => {
            expect(() => workspace.in(SongBlueprint).prepareSave([song("A")])).toThrow(
                /not all mutations have been accepted/,
            );
        });
    });

    describe("songs with their artist (outbound relation)", () => {
        const select = { artist: true } as const;

        describe.each<
            [
                string,
                () => { artists?: ReturnType<MusicBackend["useArtists"]>; songs: ReturnType<MusicBackend["useSongs"]> },
            ]
        >([
            [
                "batch create mutators for artists and songs",
                () => ({ artists: backend.useArtists("create"), songs: backend.useSongs("create") }),
            ],
            [
                "one-entity create mutators for artists and songs",
                () => ({
                    artists: backend.useArtists("create", { one: true }),
                    songs: backend.useSongs("create", { one: true }),
                }),
            ],
            [
                "batch save mutators for artists and songs",
                () => ({ artists: backend.useArtists("save"), songs: backend.useSongs("save") }),
            ],
            [
                "a create mutator for artists and a save mutator for songs",
                () => ({ artists: backend.useArtists("create"), songs: backend.useSongs("save") }),
            ],
        ])("creating a song and its new artist using %s", (_, useMutators) => {
            it("should create the artist first and pass its Id to the song", async () => {
                // arrange
                const mutators = useMutators();

                // act
                const changeset = workspace
                    .in(SongBlueprint)
                    .select(select)
                    .prepareSave([song("A", { artist: artist("Sunnexo") })]);
                const summary = await changeset.execute();

                // assert
                expect(summary.status).toEqual("succeeded");
                expect(mutators.artists).toHaveBeenCalled();
                expect(mutators.songs).toHaveBeenCalled();
                expect(mutators.artists).toHaveBeenCalledBefore(mutators.songs);
                expect(dispatched<Song>(mutators.songs)).toEqual([
                    [expect.objectContaining({ name: "A", artistId: 101 })],
                ]);
                expect(dispatched<Song>(mutators.songs)[0][0].artist).toBeUndefined();

                const [next] = changeset.getNext();
                expect(next).toEqual(expect.objectContaining({ id: 301, artistId: 101 }));
                expect(next.artist).toEqual(expect.objectContaining({ id: 101, name: "Sunnexo" }));
                expect(changeset.getPrevious()).toEqual([next]);
            });

            it("should block the song if its artist was rejected, and create both on retry", async () => {
                // arrange
                const mutators = useMutators();
                backend.rejectName("");
                const changeset = workspace
                    .in(SongBlueprint)
                    .select(select)
                    .prepareSave([song("A", { artist: artist("") })]);

                // act
                const first = await changeset.execute();
                const previousAfterFirst = changeset.getPrevious();
                const [form] = changeset.getNext();
                form.artist!.name = "Sunnexo";
                changeset.update([form]);
                const second = await changeset.execute();

                // assert
                expect(first.status).toEqual("failed");
                expect(first.failed.map(item => item.entity.name)).toEqual([""]);
                expect(first.blocked.map(item => item.entity.name)).toEqual(["A"]);
                expect(previousAfterFirst).toEqual([]);

                expect(second.status).toEqual("succeeded");
                expect(allDispatchedNames(mutators.artists!)).toEqual(["", "Sunnexo"]);
                expect(allDispatchedNames(mutators.songs)).toEqual(["A"]);
                expect(changeset.getNext()[0]).toEqual(expect.objectContaining({ id: 301, artistId: 101 }));
            });

            it("should not create the artist again if only the song failed", async () => {
                // arrange
                const mutators = useMutators();
                backend.rejectName("");
                const changeset = workspace
                    .in(SongBlueprint)
                    .select(select)
                    .prepareSave([song("", { artist: artist("Sunnexo") })]);

                // act
                const first = await changeset.execute();
                backend.clearRejections();
                const second = await changeset.execute();

                // assert
                expect(first.status).toEqual("partial");
                expect(second.status).toEqual("succeeded");
                expect(allDispatchedNames(mutators.artists!)).toEqual(["Sunnexo"]);
                expect(dispatched<Song>(mutators.songs)[1]).toEqual([expect.objectContaining({ artistId: 101 })]);
            });
        });

        describe.each<[string, MutatorType, MutatorOptions<Song>]>([
            ["a batch save mutator for songs that includes the artist", "save", { select }],
            ["a one-entity save mutator for songs that includes the artist", "save", { select, one: true }],
            ["a batch create mutator for songs that includes the artist", "create", { select }],
        ])("creating a song and its new artist using %s", (_, type, options) => {
            it("should dispatch the song together with its artist in one call", async () => {
                // arrange
                const songs = backend.useSongs(type, options);

                // act
                const changeset = workspace
                    .in(SongBlueprint)
                    .select(select)
                    .prepareSave([song("A", { artist: artist("Sunnexo") })]);
                const summary = await changeset.execute();

                // assert
                expect(summary.status).toEqual("succeeded");
                expect(summary.items.map(item => [item.schema.getName(), item.type])).toEqual([
                    ["songs", "create"],
                    ["artists", "create"],
                ]);
                expect(songs).toHaveBeenCalledTimes(1);
                expect(dispatched<Song>(songs)[0][0].artist).toEqual(
                    expect.objectContaining({ id: 0, name: "Sunnexo" }),
                );

                const [next] = changeset.getNext();
                expect(next).toEqual(expect.objectContaining({ id: 301, artistId: 101 }));
                expect(next.artist).toEqual(expect.objectContaining({ id: 101 }));
            });

            it("should fail the song if the backend rejected its artist", async () => {
                // arrange
                backend.useSongs(type, options);
                backend.rejectName("");

                // act
                const summary = await workspace
                    .in(SongBlueprint)
                    .select(select)
                    .prepareSave([song("A", { artist: artist("") })])
                    .execute();

                // assert
                expect(summary.status).toEqual("failed");
                expect(summary.items.map(item => [item.entity.name, item.status])).toEqual([
                    ["A", "failed"],
                    ["", "failed"],
                ]);
            });
        });

        it("should throw if the song mutator does not include the artist and no artist mutator exists", () => {
            // arrange
            backend.useSongs("create");

            // act & assert
            expect(() =>
                workspace
                    .in(SongBlueprint)
                    .select(select)
                    .prepareSave([song("A", { artist: artist("Sunnexo") })]),
            ).toThrow(/not all mutations have been accepted/);
        });

        it("should create an artist shared by multiple songs only once", async () => {
            // arrange
            const artists = backend.useArtists("create");
            const songs = backend.useSongs("create");
            const sunnexo = artist("Sunnexo");

            // act
            const changeset = workspace
                .in(SongBlueprint)
                .select(select)
                .prepareSave([song("A", { artist: sunnexo }), song("B", { artist: sunnexo })]);
            await changeset.execute();

            // assert
            expect(dispatchedNames(artists)).toEqual([["Sunnexo"]]);
            expect(
                dispatched<Song>(songs)
                    .flat()
                    .map(song => song.artistId),
            ).toEqual([101, 101]);
            expect(changeset.getNext().map(song => song.artistId)).toEqual([101, 101]);
        });

        it("should only update the artist if nothing but the artist changed", async () => {
            // arrange
            const artists = backend.useArtists("update");
            const songs = backend.useSongs("update");
            const previous = [song("A", { id: 1, artistId: 7, artist: artist("Sunnexo", { id: 7 }) })];
            const next = [song("A", { id: 1, artistId: 7, artist: artist("Sunnexo*", { id: 7 }) })];

            // act
            const changeset = workspace.in(SongBlueprint).select(select).prepareSave(next, previous);
            const summary = await changeset.execute();

            // assert
            expect(summary.items.map(item => [item.schema.getName(), item.type])).toEqual([["artists", "update"]]);
            expect(dispatchedNames(artists)).toEqual([["Sunnexo*"]]);
            expect(songs).not.toHaveBeenCalled();
            expect(changeset.getPrevious()).toEqual(next);
        });

        it("should create a song for an existing, unchanged artist without touching the artist", async () => {
            // arrange
            const artists = backend.useArtists("save");
            const songs = backend.useSongs("create");
            const sunnexo = artist("Sunnexo", { id: 7 });
            const previous = [song("A", { id: 1, artistId: 7, artist: sunnexo })];
            const next = [...structuredClone(previous), song("B", { artist: structuredClone(sunnexo) })];

            // act
            const changeset = workspace.in(SongBlueprint).select(select).prepareSave(next, previous);
            await changeset.execute();

            // assert
            expect(artists).not.toHaveBeenCalled();
            expect(dispatched<Song>(songs)).toEqual([[expect.objectContaining({ name: "B", artistId: 7 })]]);
        });

        it("should ignore the artist if it is not selected", async () => {
            // arrange
            const artists = backend.useArtists("create");
            const songs = backend.useSongs("create");

            // act
            const changeset = workspace.in(SongBlueprint).prepareSave([song("A", { artist: artist("Sunnexo") })]);
            const summary = await changeset.execute();

            // assert
            expect(summary.items.map(item => item.schema.getName())).toEqual(["songs"]);
            expect(artists).not.toHaveBeenCalled();
            expect(dispatched<Song>(songs)).toEqual([[expect.objectContaining({ name: "A", artistId: 0 })]]);
            expect(dispatched<Song>(songs)[0][0].artist).toBeUndefined();
        });

        it("should keep creating songs that do not depend on an artist that was rejected", async () => {
            // arrange
            backend.useArtists("create");
            const songs = backend.useSongs("create");
            backend.rejectName("");

            // act
            const changeset = workspace
                .in(SongBlueprint)
                .select(select)
                .prepareSave([song("A", { artist: artist("") }), song("B", { artistId: 7 })]);
            const summary = await changeset.execute();

            // assert
            expect(summary.status).toEqual("partial");
            expect(summary.items.map(item => [item.entity.name, item.status])).toEqual([
                ["", "failed"],
                ["A", "blocked"],
                ["B", "succeeded"],
            ]);
            expect(dispatchedNames(songs)).toEqual([["B"]]);
            expect(changeset.getPrevious()).toEqual([expect.objectContaining({ name: "B", id: 301 })]);
        });
    });

    describe("artists with their songs (inbound relation)", () => {
        const select = { songs: true } as const;

        describe.each<
            [
                string,
                () => { artists: ReturnType<MusicBackend["useArtists"]>; songs?: ReturnType<MusicBackend["useSongs"]> },
            ]
        >([
            [
                "batch create mutators for artists and songs",
                () => ({ artists: backend.useArtists("create"), songs: backend.useSongs("create") }),
            ],
            [
                "one-entity create mutators for artists and songs",
                () => ({
                    artists: backend.useArtists("create", { one: true }),
                    songs: backend.useSongs("create", { one: true }),
                }),
            ],
            [
                "batch save mutators for artists and songs",
                () => ({ artists: backend.useArtists("save"), songs: backend.useSongs("save") }),
            ],
        ])("creating an artist and its new songs using %s", (_, useMutators) => {
            it("should create the artist first and pass its Id to the songs", async () => {
                // arrange
                const mutators = useMutators();

                // act
                const changeset = workspace
                    .in(ArtistBlueprint)
                    .select(select)
                    .prepareSave(artist("Sunnexo", { songs: [song("A"), song("B")] }));
                const summary = await changeset.execute();

                // assert
                expect(summary.status).toEqual("succeeded");
                expect(mutators.artists).toHaveBeenCalled();
                expect(mutators.songs).toHaveBeenCalled();
                expect(mutators.artists).toHaveBeenCalledBefore(mutators.songs!);
                expect(dispatched<Artist>(mutators.artists)[0][0].songs).toBeUndefined();
                expect(
                    dispatched<Song>(mutators.songs!)
                        .flat()
                        .map(song => [song.name, song.artistId]),
                ).toEqual([
                    ["A", 101],
                    ["B", 101],
                ]);

                const [next] = changeset.getNext();
                expect(next.id).toEqual(101);
                expect(next.songs!.map(song => [song.id, song.artistId])).toEqual([
                    [301, 101],
                    [302, 101],
                ]);
                expect(changeset.getPrevious()).toEqual([next]);
            });

            it("should block all songs if the artist was rejected", async () => {
                // arrange
                const mutators = useMutators();
                backend.rejectName("");

                // act
                const changeset = workspace
                    .in(ArtistBlueprint)
                    .select(select)
                    .prepareSave(artist("", { songs: [song("A"), song("B")] }));
                const summary = await changeset.execute();

                // assert
                expect(summary.status).toEqual("failed");
                expect(summary.blocked.map(item => item.entity.name)).toEqual(["A", "B"]);
                expect(mutators.songs).not.toHaveBeenCalled();
                expect(changeset.getPrevious()).toEqual([]);
            });

            it("should keep the artist and the created songs as previous if one song was rejected", async () => {
                // arrange
                const mutators = useMutators();
                backend.rejectName("");
                const changeset = workspace
                    .in(ArtistBlueprint)
                    .select(select)
                    .prepareSave(artist("Sunnexo", { songs: [song("A"), song("")] }));

                // act
                const first = await changeset.execute();
                const [form] = changeset.getNext();
                form.songs![1].name = "B";
                changeset.update([form]);
                const second = await changeset.execute();

                // assert
                expect(first.status).toEqual("partial");
                expect(first.failed.map(item => item.entity.name)).toEqual([""]);

                expect(second.status).toEqual("succeeded");
                expect(second.items.map(item => [item.schema.getName(), item.entity.name])).toEqual([["songs", "B"]]);
                expect(allDispatchedNames(mutators.artists)).toEqual(["Sunnexo"]);
                expect(dispatched<Song>(mutators.songs!).flat().at(-1)).toEqual(
                    expect.objectContaining({ name: "B", artistId: 101 }),
                );

                const [previous] = changeset.getPrevious();
                expect(previous.songs!.map(song => [song.id, song.name])).toEqual([
                    [301, "A"],
                    [302, "B"],
                ]);
            });
        });

        describe.each<[string, MutatorType, MutatorOptions<Artist>]>([
            ["a batch save mutator for artists that includes songs", "save", { select }],
            ["a one-entity save mutator for artists that includes songs", "save", { select, one: true }],
            ["a batch create mutator for artists that includes songs", "create", { select }],
            ["a one-entity create mutator for artists that includes songs", "create", { select, one: true }],
        ])("creating an artist and its new songs using %s", (_, type, options) => {
            it("should dispatch the artist together with its songs in one call", async () => {
                // arrange
                const artists = backend.useArtists(type, options);

                // act
                const changeset = workspace
                    .in(ArtistBlueprint)
                    .select(select)
                    .prepareSave(artist("Sunnexo", { songs: [song("A"), song("B")] }));
                const summary = await changeset.execute();

                // assert
                expect(summary.status).toEqual("succeeded");
                expect(artists).toHaveBeenCalledTimes(1);
                expect(dispatched<Artist>(artists)[0][0].songs!.map(song => song.name)).toEqual(["A", "B"]);

                const [next] = changeset.getNext();
                expect(next.id).toEqual(101);
                expect(next.songs!.map(song => [song.id, song.artistId])).toEqual([
                    [301, 101],
                    [302, 101],
                ]);
            });

            it("should report a song the backend rejected while the artist and other songs succeed", async () => {
                // arrange
                backend.useArtists(type, options);
                backend.rejectName("");

                // act
                const changeset = workspace
                    .in(ArtistBlueprint)
                    .select(select)
                    .prepareSave(artist("Sunnexo", { songs: [song("A"), song("")] }));
                const summary = await changeset.execute();

                // assert
                expect(summary.status).toEqual("partial");
                expect(summary.items.map(item => [item.entity.name, item.status])).toEqual([
                    ["Sunnexo", "succeeded"],
                    ["A", "succeeded"],
                    ["", "failed"],
                ]);
                expect(summary.failed[0].errorPath).toEqual("name");

                const [previous] = changeset.getPrevious();
                expect(previous.songs!.map(song => song.name)).toEqual(["A"]);
            });
        });

        it("should only let an artist save mutator including songs delete songs of the artists it saves", async () => {
            // arrange
            const artists = backend.useArtists("save", { select });
            const songDeletes = backend.useSongs("delete");
            const previous = [
                artist("changed", {
                    id: 7,
                    songs: [song("A", { id: 1, artistId: 7 }), song("B", { id: 2, artistId: 7 })],
                }),
                artist("unchanged", {
                    id: 8,
                    songs: [song("C", { id: 3, artistId: 8 }), song("D", { id: 4, artistId: 8 })],
                }),
            ];
            const next = structuredClone(previous);
            next[0].name = "changed*";
            next[0].songs = [next[0].songs![0]];
            next[1].songs = [next[1].songs![0]];

            // act
            const changeset = workspace.in(ArtistBlueprint).select(select).prepareSave(next, previous);
            const summary = await changeset.execute();

            // assert
            expect(summary.status).toEqual("succeeded");
            expect(dispatched<Artist>(artists)).toEqual([
                [expect.objectContaining({ name: "changed*", songs: [expect.objectContaining({ name: "A" })] })],
            ]);
            expect(dispatchedNames(songDeletes)).toEqual([["D"]]);
            expect(changeset.getPrevious().map(artist => artist.songs?.map(song => song.name))).toEqual([["A"], ["C"]]);
        });

        it("should throw if the artist mutator does not include songs and no song mutator exists", () => {
            // arrange
            backend.useArtists("create");

            // act & assert
            expect(() =>
                workspace
                    .in(ArtistBlueprint)
                    .select(select)
                    .prepareSave(artist("Sunnexo", { songs: [song("A")] })),
            ).toThrow(/not all mutations have been accepted/);
        });

        describe("changing the songs of an existing artist", () => {
            let previous: Artist;
            let next: Artist;

            beforeEach(() => {
                previous = artist("Sunnexo", {
                    id: 7,
                    songs: [
                        song("kept", { id: 1, artistId: 7 }),
                        song("changed", { id: 2, artistId: 7 }),
                        song("removed", { id: 3, artistId: 7 }),
                    ],
                });

                next = artist("Sunnexo", {
                    id: 7,
                    songs: [
                        song("kept", { id: 1, artistId: 7 }),
                        song("changed*", { id: 2, artistId: 7 }),
                        song("added"),
                    ],
                });
            });

            it("should dispatch song creates, updates and deletes to their respective mutators", async () => {
                // arrange
                const artists = backend.useArtists("save");
                const create = backend.useSongs("create");
                const update = backend.useSongs("update");
                const del = backend.useSongs("delete");

                // act
                const changeset = workspace.in(ArtistBlueprint).select(select).prepareSave(next, previous);
                const summary = await changeset.execute();

                // assert
                expect(summary.status).toEqual("succeeded");
                expect(summary.items.map(item => [item.type, item.entity.name])).toEqual(
                    expect.arrayContaining([
                        ["create", "added"],
                        ["update", "changed*"],
                        ["delete", "removed"],
                    ]),
                );
                expect(summary.items).toHaveLength(3);
                expect(artists).not.toHaveBeenCalled();
                expect(dispatched<Song>(create)).toEqual([[expect.objectContaining({ name: "added", artistId: 7 })]]);
                expect(dispatchedNames(update)).toEqual([["changed*"]]);
                expect(dispatchedNames(del)).toEqual([["removed"]]);

                const [persisted] = changeset.getPrevious();
                expect(persisted.songs!.map(song => [song.id, song.name])).toEqual([
                    [1, "kept"],
                    [2, "changed*"],
                    [301, "added"],
                ]);
            });

            it("should dispatch song creates and updates to a song save mutator", async () => {
                // arrange
                const save = backend.useSongs("save");
                const del = backend.useSongs("delete");

                // act
                await workspace.in(ArtistBlueprint).select(select).prepareSave(next, previous).execute();

                // assert
                expect(dispatchedNames(save)).toEqual([["changed*", "added"]]);
                expect(dispatchedNames(del)).toEqual([["removed"]]);
            });

            it("should throw if no song delete mutator exists for the removed song", () => {
                // arrange
                backend.useSongs("save");

                // act & assert
                expect(() => workspace.in(ArtistBlueprint).select(select).prepareSave(next, previous)).toThrow(
                    /not all mutations have been accepted/,
                );
            });

            it("should throw if only an artist save mutator including songs exists, but the artist did not change", () => {
                // arrange
                backend.useArtists("save", { select });

                // act & assert
                expect(() => workspace.in(ArtistBlueprint).select(select).prepareSave(next, previous)).toThrow(
                    /not all mutations have been accepted/,
                );
            });

            it("should dispatch the whole aggregate to an artist save mutator including songs if the artist changed", async () => {
                // arrange
                const artists = backend.useArtists("save", { select });
                next.name = "Sunnexo*";

                // act
                const changeset = workspace.in(ArtistBlueprint).select(select).prepareSave(next, previous);
                const summary = await changeset.execute();

                // assert
                expect(summary.status).toEqual("succeeded");
                expect(artists).toHaveBeenCalledTimes(1);
                expect(dispatched<Artist>(artists)[0][0].songs!.map(song => song.name)).toEqual([
                    "kept",
                    "changed*",
                    "added",
                ]);
                expect(changeset.getPrevious()[0].songs!.map(song => [song.id, song.name])).toEqual([
                    [1, "kept"],
                    [2, "changed*"],
                    [301, "added"],
                ]);
            });

            it("should keep a song that failed to be deleted as previous", async () => {
                // arrange
                backend.useSongs("save");
                backend.useSongs("delete");
                backend.rejectName("removed", ["delete"]);

                // act
                const changeset = workspace.in(ArtistBlueprint).select(select).prepareSave(next, previous);
                const summary = await changeset.execute();

                // assert
                expect(summary.status).toEqual("partial");
                expect(summary.failed.map(item => [item.type, item.entity.name])).toEqual([["delete", "removed"]]);
                expect(changeset.getPrevious()[0].songs!.map(song => song.name)).toEqual(
                    expect.arrayContaining(["kept", "changed*", "added", "removed"]),
                );
            });

            it("should not delete songs if the songs are omitted", async () => {
                // arrange
                const songs = backend.useSongs("delete");
                const artists = backend.useArtists("update");
                const { songs: _, ...withoutSongs } = next;

                // act
                const summary = await workspace
                    .in(ArtistBlueprint)
                    .select(select)
                    .prepareSave({ ...withoutSongs, name: "Sunnexo*" }, previous)
                    .execute();

                // assert
                expect(summary.items.map(item => [item.schema.getName(), item.type])).toEqual([["artists", "update"]]);
                expect(songs).not.toHaveBeenCalled();
                expect(artists).toHaveBeenCalledTimes(1);
            });

            it("should delete all songs if the songs are an empty array", async () => {
                // arrange
                const songs = backend.useSongs("delete");

                // act
                const changeset = workspace
                    .in(ArtistBlueprint)
                    .select(select)
                    .prepareSave({ ...next, songs: [] }, previous);
                await changeset.execute();

                // assert
                expect(allDispatchedNames(songs)).toEqual(["kept", "changed", "removed"]);
                expect(changeset.getPrevious()[0].songs).toEqual([]);
            });

            it("should not touch the songs if they are not selected", async () => {
                // arrange
                const artists = backend.useArtists("update");
                next.name = "Sunnexo*";

                // act
                const summary = await workspace.in(ArtistBlueprint).prepareSave(next, previous).execute();

                // assert
                expect(summary.items.map(item => [item.schema.getName(), item.type])).toEqual([["artists", "update"]]);
                expect(dispatched<Artist>(artists)[0][0].songs).toBeUndefined();
            });
        });
    });

    describe("artists with their songs and the albums of those songs (nested relations)", () => {
        const select = { songs: { album: true } } as const;

        const input = () => {
            const shared = album("Album");
            return artist("Sunnexo", { songs: [song("A", { album: shared }), song("B", { album: shared })] });
        };

        it("should create albums and the artist before the songs, using separate mutators", async () => {
            // arrange
            const artists = backend.useArtists("create");
            const songs = backend.useSongs("create");
            const albums = backend.useAlbums("create");

            // act
            const changeset = workspace.in(ArtistBlueprint).select(select).prepareSave(input());
            const summary = await changeset.execute();

            // assert
            expect(summary.status).toEqual("succeeded");
            expect(dispatchedNames(albums)).toEqual([["Album"]]);
            expect(artists).toHaveBeenCalledBefore(songs);
            expect(albums).toHaveBeenCalledBefore(songs);
            expect(
                dispatched<Song>(songs)
                    .flat()
                    .map(song => [song.name, song.artistId, song.albumId]),
            ).toEqual([
                ["A", 101, 201],
                ["B", 101, 201],
            ]);

            const [next] = changeset.getNext();
            expect(next.songs!.map(song => [song.id, song.albumId, song.album?.id])).toEqual([
                [301, 201, 201],
                [302, 201, 201],
            ]);
        });

        it("should dispatch everything to an artist save mutator including songs and albums", async () => {
            // arrange
            const artists = backend.useArtists("save", { select });

            // act
            const changeset = workspace.in(ArtistBlueprint).select(select).prepareSave(input());
            const summary = await changeset.execute();

            // assert
            expect(summary.status).toEqual("succeeded");
            expect(artists).toHaveBeenCalledTimes(1);

            const [dispatchedArtist] = dispatched<Artist>(artists)[0];
            expect(dispatchedArtist.songs!.map(song => song.album?.name)).toEqual(["Album", "Album"]);
            expect(changeset.getNext()[0].songs!.map(song => song.id)).toEqual([301, 302]);
        });

        it("should create the album first if the artist save mutator only includes songs", async () => {
            // arrange
            const artists = backend.useArtists("save", { select: { songs: true } });
            const albums = backend.useAlbums("create");

            // act
            const changeset = workspace.in(ArtistBlueprint).select(select).prepareSave(input());
            const summary = await changeset.execute();

            // assert
            expect(summary.status).toEqual("succeeded");
            expect(albums).toHaveBeenCalled();
            expect(albums).toHaveBeenCalledBefore(artists);
            expect(dispatched<Artist>(artists)[0][0].songs!.map(song => [song.albumId, song.album])).toEqual([
                [201, undefined],
                [201, undefined],
            ]);
            expect(changeset.getNext()[0].songs!.map(song => [song.id, song.albumId])).toEqual([
                [301, 201],
                [302, 201],
            ]);
        });

        it("should block the songs of a rejected album, but still create the artist", async () => {
            // arrange
            backend.useArtists("create");
            const songs = backend.useSongs("create");
            backend.useAlbums("create");
            backend.rejectName("Album");

            // act
            const changeset = workspace.in(ArtistBlueprint).select(select).prepareSave(input());
            const summary = await changeset.execute();

            // assert
            expect(summary.status).toEqual("partial");
            expect(summary.items.map(item => [item.entity.name, item.status])).toEqual(
                expect.arrayContaining([
                    ["Sunnexo", "succeeded"],
                    ["Album", "failed"],
                    ["A", "blocked"],
                    ["B", "blocked"],
                ]),
            );
            expect(songs).not.toHaveBeenCalled();
            expect(changeset.getPrevious()).toEqual([expect.objectContaining({ id: 101, name: "Sunnexo" })]);
        });

        it("should not create albums if only the songs are selected", async () => {
            // arrange
            backend.useArtists("create");
            const songs = backend.useSongs("create");
            const albums = backend.useAlbums("create");

            // act
            await workspace.in(ArtistBlueprint).select({ songs: true }).prepareSave(input()).execute();

            // assert
            expect(albums).not.toHaveBeenCalled();
            expect(
                dispatched<Song>(songs)
                    .flat()
                    .map(song => song.albumId),
            ).toEqual([0, 0]);
        });
    });

    describe("songs with their album and the artist of that album", () => {
        it("should create artist and album before the song", async () => {
            // arrange
            const artists = backend.useArtists("create");
            const albums = backend.useAlbums("create");
            const songs = backend.useSongs("create");
            const input = song("A", { album: album("Album", { artist: artist("Sunnexo") }) });

            // act
            const changeset = workspace
                .in(SongBlueprint)
                .select({ album: { artist: true } })
                .prepareSave([input]);
            const summary = await changeset.execute();

            // assert
            expect(summary.status).toEqual("succeeded");
            expect(artists).toHaveBeenCalledBefore(albums);
            expect(albums).toHaveBeenCalledBefore(songs);
            expect(dispatched<Album>(albums)).toEqual([[expect.objectContaining({ name: "Album", artistId: 101 })]]);
            expect(dispatched<Song>(songs)).toEqual([[expect.objectContaining({ name: "A", albumId: 201 })]]);
        });
    });

    describe("selection forms", () => {
        it.each([
            ["true", { songs: true }],
            ["an empty object", { songs: {} }],
            ["a selection of primitive fields", { songs: { name: true } }],
        ] as const)("should treat a related selection given as %s the same", async (_, select) => {
            // arrange
            backend.useArtists("create");
            const songs = backend.useSongs("create");

            // act
            const changeset = workspace
                .in(ArtistBlueprint)
                .select(select)
                .prepareSave(artist("Sunnexo", { songs: [song("A")] }));
            const summary = await changeset.execute();

            // assert
            expect(summary.status).toEqual("succeeded");
            expect(dispatched<Song>(songs)).toEqual([[expect.objectContaining({ name: "A", artistId: 101 })]]);
        });

        it("should pass the selection a mutator accepted to it", async () => {
            // arrange
            const artists = backend.useArtists("save", { select: { songs: { album: true } } });

            // act
            await workspace
                .in(ArtistBlueprint)
                .select({ songs: true })
                .prepareSave(artist("Sunnexo", { songs: [song("A")] }))
                .execute();

            // assert
            expect(artists).toHaveBeenCalledWith(expect.objectContaining({ selection: { songs: true } }));
        });
    });

    describe("songs with tags (outbound relation via an array of Ids)", () => {
        it("should create new tags first and write their Ids to the song", async () => {
            // arrange
            const tags = backend.useTags("create");
            const songs = backend.useSongs("create");

            // act
            const changeset = workspace
                .in(SongBlueprint)
                .select({ tags: true })
                .prepareSave([song("A", { tags: [tag("rock"), tag("pop")] })]);
            const summary = await changeset.execute();

            // assert
            expect(summary.status).toEqual("succeeded");
            expect(dispatchedNames(tags)).toEqual([["rock", "pop"]]);
            expect(tags).toHaveBeenCalledBefore(songs);
            expect(dispatched<Song>(songs)).toEqual([[expect.objectContaining({ tagIds: ["tag-1", "tag-2"] })]]);
            expect(changeset.getNext()[0].tagIds).toEqual(["tag-1", "tag-2"]);
            expect(changeset.getNext()[0].tags!.map(tag => tag.id)).toEqual(["tag-1", "tag-2"]);
        });

        it("should treat related tags that have an Id as updates if there is no previous", async () => {
            // arrange
            const tags = backend.useTags("save");
            backend.useSongs("create");

            // act
            const changeset = workspace
                .in(SongBlueprint)
                .select({ tags: true })
                .prepareSave([song("A", { tagIds: ["rock"], tags: [tag("Rock", { id: "rock" }), tag("pop")] })]);
            const summary = await changeset.execute();

            // assert
            expect(summary.items.map(item => [item.schema.getName(), item.type, item.entity.name])).toEqual(
                expect.arrayContaining([
                    ["tags", "update", "Rock"],
                    ["tags", "create", "pop"],
                    ["songs", "create", "A"],
                ]),
            );
            expect(allDispatchedNames(tags)).toEqual(["Rock", "pop"]);
            expect(changeset.getNext()[0].tagIds).toEqual(["rock", "tag-1"]);
        });

        it("should only create the new tags if the existing ones did not change compared to previous", async () => {
            // arrange
            const tags = backend.useTags("create");
            const songs = backend.useSongs("update");
            const previous = song("A", { id: 1, tagIds: ["rock"], tags: [tag("Rock", { id: "rock" })] });
            const next = song("A", { id: 1, tagIds: ["rock"], tags: [tag("Rock", { id: "rock" }), tag("pop")] });

            // act
            const changeset = workspace.in(SongBlueprint).select({ tags: true }).prepareSave(next, previous);
            await changeset.execute();

            // assert
            expect(dispatchedNames(tags)).toEqual([["pop"]]);
            expect(dispatched<Song>(songs)).toEqual([[expect.objectContaining({ tagIds: ["rock", "tag-1"] })]]);
        });
    });
});

import { AlbumBlueprint, Artist, ArtistBlueprint, Song, SongBlueprint } from "@entity-space/elements/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EntityWorkspace } from "../../entity-workspace";
import {
    CreateEntitiesFn,
    DeleteEntitiesFn,
    SaveEntitiesFn,
    UpdateEntitiesFn,
} from "../../mutation/entity-mutation-function.type";
import { EntityChangeItem } from "../../mutation/structures/entity-change";
import { EntityMutationError } from "../../mutation/structures/entity-mutation-error";
import { TestFacade } from "../../testing";

describe("EntityChangeset", () => {
    let facade: TestFacade;
    let workspace: EntityWorkspace;
    let nextArtistId: number;
    let nextSongId: number;

    const song = (name: string, patch: Partial<Song> = {}): Song =>
        facade.construct(SongBlueprint, { namespace: "dev", name, ...patch });

    const artist = (name: string, patch: Partial<Artist> = {}): Artist =>
        facade.construct(ArtistBlueprint, { namespace: "dev", name, ...patch });

    const useCreateArtists = (impl?: CreateEntitiesFn<ArtistBlueprint>) => {
        const create = vi.fn<CreateEntitiesFn<ArtistBlueprint>>(
            impl ?? (({ entities }) => entities.map(entity => ({ ...entity, id: nextArtistId++ }))),
        );
        facade.getServices().for(ArtistBlueprint).addCreateMutator({ create });
        return create;
    };

    const useCreateSongs = (isInvalid: (song: Song) => boolean = () => false) => {
        const create = vi.fn<CreateEntitiesFn<SongBlueprint>>(({ entities, context }) => {
            const created: Song[] = [];

            for (const entity of entities) {
                if (isInvalid(entity)) {
                    context.fail(entity, new Error("name is required"), { path: "name" });
                } else {
                    created.push({ ...entity, id: nextSongId++ });
                }
            }

            return created;
        });

        facade.getServices().for(SongBlueprint).addCreateMutator({ create });
        return create;
    };

    const byName = (items: readonly EntityChangeItem[], name: string) => items.find(item => item.entity.name === name)!;

    beforeEach(() => {
        facade = new TestFacade();
        workspace = facade.getWorkspace();
        nextArtistId = 1;
        nextSongId = 1;
    });

    describe("preview", () => {
        it("should pass supplied temporary Ids to mutators and return persisted copies without mutating inputs", async () => {
            // arrange
            const save = vi.fn<SaveEntitiesFn<ArtistBlueprint>>(({ entities }) =>
                entities.map(entity => ({
                    ...entity,
                    id: 1,
                    songs: entity.songs?.map(song => ({ ...song, id: 2 })),
                })),
            );
            facade.getServices().for(ArtistBlueprint).addSaveMutator({ select: { songs: true }, save });
            const newArtist = artist("new", { id: -1, songs: [song("new song", { id: -2 })] });
            const input = structuredClone(newArtist);

            // act
            const [next, previous] = await workspace.in(ArtistBlueprint).select({ songs: true }).save(newArtist);

            // assert
            expect(save.mock.calls[0][0].entities[0]).toMatchObject({
                id: -1,
                songs: [{ id: -2, artistId: -1 }],
            });
            expect(newArtist).toEqual(input);
            expect(next).toMatchObject({ id: 1, songs: [{ id: 2, artistId: 1 }] });
            expect(next).not.toBe(newArtist);
            expect(previous).toMatchObject({ id: 1, songs: [{ id: 2, artistId: 1 }] });
        });

        it("should plan items with dependencies without calling any mutator", () => {
            // arrange
            const createArtists = useCreateArtists();
            const createSongs = useCreateSongs();
            const sharedArtist = artist("Sunnexo");
            const songs = [song("a", { artist: sharedArtist }), song("b", { artist: sharedArtist })];

            // act
            const changeset = workspace.in(SongBlueprint).select({ artist: true }).prepareSave(songs);
            const items = changeset.getItems();

            // assert
            expect(items.map(item => [item.schema.getName(), item.type, item.status])).toEqual([
                ["artists", "create", "pending"],
                ["songs", "create", "pending"],
                ["songs", "create", "pending"],
            ]);

            const artistItem = items[0];
            expect(items[1].dependsOn).toEqual([artistItem.key]);
            expect(items[2].dependsOn).toEqual([artistItem.key]);
            expect(new Set(items.map(item => item.key)).size).toEqual(3);
            expect(changeset.getStatus()).toEqual("pending");
            expect(createArtists).not.toHaveBeenCalled();
            expect(createSongs).not.toHaveBeenCalled();
        });

        it("should throw if a change is not accepted by any mutator", () => {
            expect(() => workspace.in(SongBlueprint).prepareSave([song("a")])).toThrow(
                /not all mutations have been accepted/,
            );
        });
    });

    describe("partial success", () => {
        it("should report entities a batch mutator failed, including the path of the error", async () => {
            // arrange
            const createSongs = useCreateSongs(song => song.name === "");
            const songs = [song("valid", { id: -1 }), song("", { id: -2 })];

            // act
            const changeset = workspace.in(SongBlueprint).prepareSave(songs);
            const summary = await changeset.execute();

            // assert
            expect(createSongs).toHaveBeenCalledTimes(1);
            expect(summary.status).toEqual("partial");
            expect(summary.succeeded.map(item => item.entity.name)).toEqual(["valid"]);
            expect(summary.failed).toHaveLength(1);
            expect(summary.failed[0].error).toEqual(new Error("name is required"));
            expect(summary.failed[0].errorPath).toEqual("name");

            const [created, notCreated] = changeset.getNext();
            expect(created.id).toEqual(1);
            expect(notCreated.id).toEqual(-2);
            expect(changeset.getPrevious()).toEqual([created]);
            expect(songs[0].id).toEqual(-1);
        });

        it("should report entities a batch update mutator failed", async () => {
            // arrange
            const update = vi.fn<UpdateEntitiesFn<SongBlueprint>>(({ entities, context }) => {
                context.fail(entities[1], new Error("conflict"));
                return [entities[0]];
            });
            facade.getServices().for(SongBlueprint).addUpdateMutator({ update });
            const previous = [song("a", { id: 1 }), song("b", { id: 2 })];
            const next = [song("a*", { id: 1 }), song("b*", { id: 2 })];

            // act
            const changeset = workspace.in(SongBlueprint).prepareSave(next, previous);
            const summary = await changeset.execute();

            // assert
            expect(summary.status).toEqual("partial");
            expect(byName(summary.items, "a*").status).toEqual("succeeded");
            expect(byName(summary.items, "b*").error).toEqual(new Error("conflict"));
            expect(changeset.getPrevious().map(song => song.name)).toEqual(["a*", "b"]);
        });

        it("should report entities a batch delete mutator failed", async () => {
            // arrange
            const del = vi.fn<DeleteEntitiesFn<SongBlueprint>>(({ entities, context }) => {
                context.fail(entities[0], new Error("in use"));
            });
            facade.getServices().for(SongBlueprint).addDeleteMutator({ delete: del });

            // act
            const changeset = workspace.in(SongBlueprint).prepareDelete([song("a", { id: 1 }), song("b", { id: 2 })]);
            const summary = await changeset.execute();

            // assert
            expect(summary.status).toEqual("partial");
            expect(summary.failed.map(item => item.entity.id)).toEqual([1]);
            expect(changeset.getPrevious().map(song => song.id)).toEqual([1]);
        });

        it("should block dependents of failed changes and keep running independent ones", async () => {
            // arrange
            const createArtists = useCreateArtists(({ entities, context }) => {
                entities.forEach(entity => context.fail(entity, new Error("artist rejected")));
                return [];
            });
            const createSongs = useCreateSongs();
            const songs = [song("dependent", { artist: artist("rejected") }), song("independent", { artistId: 7 })];

            // act
            const changeset = workspace.in(SongBlueprint).select({ artist: true }).prepareSave(songs);
            const summary = await changeset.execute();

            // assert
            expect(createArtists).toHaveBeenCalledTimes(1);
            expect(createSongs).toHaveBeenCalledTimes(1);
            expect(createSongs.mock.calls[0][0].entities.map(entity => entity.name)).toEqual(["independent"]);
            expect(summary.status).toEqual("partial");
            expect(byName(summary.items, "rejected").status).toEqual("failed");
            expect(byName(summary.items, "dependent").status).toEqual("blocked");
            expect(byName(summary.items, "independent").status).toEqual("succeeded");
        });

        it("should treat a throwing mutator as having persisted nothing of its batch", async () => {
            // arrange
            const createArtists = useCreateArtists(() => {
                throw new Error("service unavailable");
            });
            useCreateSongs();

            // act
            const summary = await workspace
                .in(SongBlueprint)
                .select({ artist: true })
                .prepareSave([song("a", { artist: artist("x") }), song("b", { artist: artist("y") })])
                .execute();

            // assert
            expect(createArtists).toHaveBeenCalledTimes(1);
            expect(summary.status).toEqual("failed");
            expect(summary.failed.map(item => item.error)).toEqual([
                new Error("service unavailable"),
                new Error("service unavailable"),
            ]);
            expect(summary.blocked).toHaveLength(2);
        });
    });

    describe("retry", () => {
        it("should not create a related entity again if only the root failed to be created", async () => {
            // arrange
            const createArtists = useCreateArtists();
            const createSongs = useCreateSongs();
            createSongs.mockImplementationOnce(() => {
                throw new Error("temporarily unavailable");
            });

            const changeset = workspace
                .in(SongBlueprint)
                .select({ artist: true })
                .prepareSave([song("a", { artist: artist("Sunnexo") })]);

            const first = await changeset.execute();
            expect(first.status).toEqual("partial");
            expect(changeset.getPrevious()).toEqual([]);

            // act
            const second = await changeset.execute();

            // assert
            expect(second.status).toEqual("succeeded");
            expect(second.items.map(item => item.schema.getName())).toEqual(["songs"]);
            expect(createArtists).toHaveBeenCalledTimes(1);
            expect(createSongs).toHaveBeenCalledTimes(2);
            expect(createSongs.mock.calls[1][0].entities[0].artistId).toEqual(1);

            const [saved] = changeset.getNext();
            expect(saved.id).toEqual(1);
            expect(saved.artistId).toEqual(1);
            expect(saved.artist?.id).toEqual(1);
            expect(changeset.getPrevious()).toEqual([saved]);
        });

        it("should keep the error of a failed change after update() until it runs again", async () => {
            // arrange
            const createSongs = useCreateSongs(song => song.name === "");
            const changeset = workspace.in(SongBlueprint).prepareSave([song("")]);
            await changeset.execute();

            const form = changeset.getNext();
            form[0].name = "fixed";

            // act
            changeset.update(form);
            const pending = changeset.getItems()[0];
            const summary = await changeset.execute();

            // assert
            expect(pending.status).toEqual("pending");
            expect(pending.error).toEqual(new Error("name is required"));
            expect(pending.errorPath).toEqual("name");
            expect(pending.key).toEqual(summary.items[0].key);
            expect(summary.status).toEqual("succeeded");
            expect(summary.items[0].error).toBeUndefined();
            expect(createSongs).toHaveBeenCalledTimes(2);
            expect(createSongs.mock.calls[1][0].entities[0]).toEqual(expect.objectContaining({ id: 0, name: "fixed" }));
            expect(changeset.getNext()[0]).toEqual(expect.objectContaining({ id: 1, name: "fixed" }));
        });

        it("should allow retrying after the save() shortcut threw", async () => {
            // arrange
            const createSongs = useCreateSongs();
            createSongs.mockImplementationOnce(() => {
                throw new Error("temporarily unavailable");
            });
            const songs = [song("a")];

            // act
            const error = await workspace
                .in(SongBlueprint)
                .save(songs)
                .catch(error => error);

            // assert
            expect(error).toBeInstanceOf(EntityMutationError);
            expect((error as EntityMutationError).summary.status).toEqual("failed");
            expect(songs[0].id).toEqual(0);

            const retried = await (error as EntityMutationError).changeset.execute();
            expect(retried.status).toEqual("succeeded");
            expect((error as EntityMutationError).changeset.getNext()[0].id).toEqual(1);
        });
    });

    describe("aggregate save", () => {
        it("should report a failed nested entity while the root succeeds", async () => {
            // arrange
            const saveArtists = vi.fn<SaveEntitiesFn<ArtistBlueprint>>(({ entities, context }) =>
                entities.map(entity => {
                    const [first, second] = entity.songs!;
                    context.fail(second, new Error("song rejected"));
                    return { ...entity, id: 1, songs: [{ ...first, id: 10, artistId: 1 }] };
                }),
            );

            facade
                .getServices()
                .for(ArtistBlueprint)
                .addSaveMutator({ select: { songs: true }, save: saveArtists });
            const input = artist("Sunnexo", {
                id: -1,
                songs: [song("accepted", { id: -2 }), song("rejected", { id: -3 })],
            });

            // act
            const changeset = workspace.in(ArtistBlueprint).select({ songs: true }).prepareSave(input);
            const summary = await changeset.execute();

            // assert
            expect(summary.status).toEqual("partial");
            expect(byName(summary.items, "Sunnexo").status).toEqual("succeeded");
            expect(byName(summary.items, "accepted").status).toEqual("succeeded");
            expect(byName(summary.items, "rejected").status).toEqual("failed");
            expect(byName(summary.items, "rejected").error).toEqual(new Error("song rejected"));

            const [next] = changeset.getNext();
            expect(next.id).toEqual(1);
            expect(next.songs![0]).toEqual(expect.objectContaining({ id: 10, artistId: 1 }));
            expect(next.songs![1].id).toEqual(-3);

            const [previous] = changeset.getPrevious();
            expect(previous.songs!.map(song => song.id)).toEqual([10]);

            // retrying the failed nested entity on its own requires a mutator for it
            const createSongs = useCreateSongs();
            const retried = await changeset.execute();
            expect(retried.status).toEqual("succeeded");
            expect(saveArtists).toHaveBeenCalledTimes(1);
            expect(createSongs.mock.calls[0][0].entities).toEqual([expect.objectContaining({ artistId: 1 })]);
        });
    });

    describe("matching results", () => {
        it("should match created entities independent of the order they are returned in", async () => {
            // arrange
            const ids: Record<string, number> = { a: 1, b: 2 };
            const create = vi.fn<CreateEntitiesFn<SongBlueprint>>(({ entities }) =>
                entities.map(entity => ({ ...entity, id: ids[entity.name] })).reverse(),
            );
            facade.getServices().for(SongBlueprint).addCreateMutator({ create });

            // act
            const changeset = workspace.in(SongBlueprint).prepareSave([song("a"), song("b")]);
            await changeset.execute();

            // assert
            expect(changeset.getNext().map(song => [song.name, song.id])).toEqual([
                ["a", 1],
                ["b", 2],
            ]);
        });

        it("should fail entities that are neither returned nor reported", async () => {
            // arrange
            const create = vi.fn<CreateEntitiesFn<SongBlueprint>>(({ entities }) => [{ ...entities[1], id: 2 }]);
            facade.getServices().for(SongBlueprint).addCreateMutator({ create });

            // act
            const summary = await workspace
                .in(SongBlueprint)
                .prepareSave([song("a"), song("b")])
                .execute();

            // assert
            expect(byName(summary.items, "a").status).toEqual("failed");
            expect(byName(summary.items, "a").error).toEqual(new Error("the mutator did not return this entity"));
            expect(byName(summary.items, "b").status).toEqual("succeeded");
        });

        it("should use explicitly reported pairs of identical entities", async () => {
            // arrange
            const create = vi.fn<CreateEntitiesFn<SongBlueprint>>(({ entities, context }) => {
                const created = [
                    { ...entities[1], id: 2 },
                    { ...entities[0], id: 1 },
                ];

                context.succeed(entities[0], created[1]);
                context.succeed(entities[1], created[0]);

                return created;
            });
            facade.getServices().for(SongBlueprint).addCreateMutator({ create });

            // act
            const changeset = workspace.in(SongBlueprint).prepareSave([song("same"), song("same")]);
            await changeset.execute();

            // assert
            expect(changeset.getNext().map(song => song.id)).toEqual([1, 2]);
        });

        it("should reject reports about entities that were not passed to the mutator", async () => {
            // arrange
            const create = vi.fn<CreateEntitiesFn<SongBlueprint>>(({ context }) => {
                context.fail(song("unknown"), new Error("nope"));
                return [];
            });
            facade.getServices().for(SongBlueprint).addCreateMutator({ create });

            // act
            const summary = await workspace
                .in(SongBlueprint)
                .prepareSave([song("a")])
                .execute();

            // assert
            expect(summary.failed[0].error).toEqual(
                new Error(
                    "context.fail() expects an entity object that was passed to the mutator (or one nested within it)",
                ),
            );
        });
    });

    describe("execution", () => {
        it("should dispatch independent batches in parallel", async () => {
            // arrange
            let releaseArtists!: () => void;
            const artistsReleased = new Promise<void>(resolve => (releaseArtists = resolve));
            useCreateArtists(async ({ entities }) => {
                await artistsReleased;
                return entities.map(entity => ({ ...entity, id: nextArtistId++ }));
            });

            const createAlbums = vi.fn(({ entities }: { entities: { id: number }[] }) =>
                entities.map(entity => ({ ...entity, id: 5 })),
            );
            facade
                .getServices()
                .for(AlbumBlueprint)
                .addCreateMutator({ create: createAlbums as any });
            useCreateSongs();

            const album = facade.construct(AlbumBlueprint, { namespace: "dev", name: "album" });
            const changeset = workspace
                .in(SongBlueprint)
                .select({ artist: true, album: true })
                .prepareSave([song("a", { artist: artist("x"), album })]);

            // act
            const execution = changeset.execute();
            await vi.waitFor(() => expect(changeset.getItems()[1].status).toEqual("succeeded"));
            const whileRunning = changeset.getItems().map(item => [item.schema.getName(), item.status]);
            releaseArtists();
            const summary = await execution;

            // assert
            expect(whileRunning).toEqual([
                ["artists", "running"],
                ["albums", "succeeded"],
                ["songs", "pending"],
            ]);
            expect(summary.status).toEqual("succeeded");
            expect(changeset.getNext()[0]).toEqual(expect.objectContaining({ artistId: 1, albumId: 5 }));
        });

        it("should emit live status updates", async () => {
            // arrange
            useCreateSongs();
            const changeset = workspace.in(SongBlueprint).prepareSave([song("a")]);
            const statuses: string[] = [];
            changeset.items$.subscribe(items => statuses.push(items[0].status));

            // act
            await changeset.execute();

            // assert
            expect(statuses[0]).toEqual("pending");
            expect(statuses).toContain("running");
            expect(statuses.at(-1)).toEqual("succeeded");
        });

        it("should cancel changes that have not been dispatched yet", async () => {
            // arrange
            useCreateArtists(
                ({ context }) =>
                    new Promise<Artist[]>((_, reject) =>
                        context.signal.addEventListener("abort", () => reject(new Error("aborted"))),
                    ),
            );
            const createSongs = useCreateSongs();
            const changeset = workspace
                .in(SongBlueprint)
                .select({ artist: true })
                .prepareSave([song("a", { artist: artist("x") })]);

            // act
            const execution = changeset.execute();
            expect(changeset.getStatus()).toEqual("running");
            changeset.cancel();
            const summary = await execution;

            // assert
            expect(summary.status).toEqual("cancelled");
            expect(byName(summary.items, "x").status).toEqual("failed");
            expect(byName(summary.items, "x").error).toEqual(new Error("aborted"));
            expect(byName(summary.items, "a").status).toEqual("cancelled");
            expect(createSongs).not.toHaveBeenCalled();
        });

        it("should not allow executing or updating while running", async () => {
            // arrange
            useCreateSongs();
            const changeset = workspace.in(SongBlueprint).prepareSave([song("a")]);

            // act
            const execution = changeset.execute();

            // assert
            expect(() => changeset.update([song("b")])).toThrow("can not update a changeset while it is executing");
            await expect(changeset.execute()).rejects.toThrow("the changeset is already executing");
            await execution;
        });
    });
});

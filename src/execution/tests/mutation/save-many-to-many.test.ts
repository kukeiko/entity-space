import { Song, SongBlueprint, SongTag, SongTagBlueprint } from "@entity-space/elements/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { EntityWorkspace } from "../../entity-workspace";
import { CreateEntityFn } from "../../mutation/entity-mutation-function.type";
import { TestFacade, TestRepository } from "../../testing";
import { createMetadata } from "../../testing/create-metadata.fn";

describe("save()", () => {
    let facade: TestFacade;
    let repository: TestRepository;
    let workspace: EntityWorkspace;

    beforeEach(() => {
        facade = new TestFacade();
        repository = facade.getTestRepository();
        workspace = facade.getWorkspace();
    });

    it("can create many-to-many relations: song.songTags", async () => {
        // arrange
        const metadata = createMetadata(1);
        const song: Song = {
            id: 0,
            albumId: 1,
            artistId: 2,
            duration: 100,
            metadata,
            name: "foo",
            namespace: "dev",
            songTags: [
                { songId: 0, tagId: "upbeat" },
                { songId: 0, tagId: "trippy" },
            ],
        };

        const expected: Song = {
            id: 1,
            albumId: 1,
            artistId: 2,
            duration: 100,
            metadata,
            name: "foo",
            namespace: "dev",
            songTags: [
                { songId: 1, tagId: "upbeat" },
                { songId: 1, tagId: "trippy" },
            ],
        };

        const createSong = repository.useMusic().useCreateSong();
        const createSongTag = repository.useMusic().useCreateSongTag();

        // act
        const actual = await workspace.in(SongBlueprint).select({ songTags: true }).save(song);

        // assert
        expect(actual).toEqual(expected);
        expect(createSong).toHaveBeenCalledTimes(1);
        expect(createSongTag).toHaveBeenCalledTimes(2);
        expect(createSong).toHaveBeenCalledWith<Parameters<CreateEntityFn<SongBlueprint>>>({
            selection: {},
            entity: { albumId: 1, artistId: 2, duration: 100, metadata, name: "foo", namespace: "dev" },
        });
        expect(createSongTag).toHaveBeenCalledWith<Parameters<CreateEntityFn<SongTagBlueprint>>>({
            selection: {},
            entity: { songId: 1, tagId: "upbeat" },
        });
        expect(createSongTag).toHaveBeenCalledWith<Parameters<CreateEntityFn<SongTagBlueprint>>>({
            selection: {},
            entity: { songId: 1, tagId: "trippy" },
        });
    });

    it("can create many-to-many relations: songTags.songs", async () => {
        // arrange
        const metadata = createMetadata(1);
        const song: Song = {
            id: 0,
            albumId: 1,
            artistId: 2,
            duration: 100,
            metadata,
            name: "foo",
            namespace: "dev",
        };

        const songTags: SongTag[] = [
            { songId: 0, tagId: "upbeat", songs: [song] },
            { songId: 0, tagId: "trippy", songs: [song] },
        ];

        const expectedSong: Song = {
            id: 1,
            albumId: 1,
            artistId: 2,
            duration: 100,
            metadata,
            name: "foo",
            namespace: "dev",
        };

        const expected: SongTag[] = [
            { songId: 1, tagId: "upbeat", songs: [expectedSong] },
            { songId: 1, tagId: "trippy", songs: [expectedSong] },
        ];

        const createSongTag = repository.useMusic().useCreateSongTag();
        const createSong = repository.useMusic().useCreateSong();

        // act
        const actual = await workspace.in(SongTagBlueprint).select({ songs: true }).save(songTags);

        // assert
        expect(actual).toEqual(expected);
        expect(createSong).toHaveBeenCalledTimes(1);
        expect(createSongTag).toHaveBeenCalledTimes(2);
        expect(createSong).toHaveBeenCalledWith<Parameters<CreateEntityFn<SongBlueprint>>>({
            selection: {},
            entity: { albumId: 1, artistId: 2, duration: 100, metadata, name: "foo", namespace: "dev" },
        });
        expect(createSongTag).toHaveBeenCalledWith<Parameters<CreateEntityFn<SongTagBlueprint>>>({
            selection: {},
            entity: { songId: 1, tagId: "upbeat" },
        });
        expect(createSongTag).toHaveBeenCalledWith<Parameters<CreateEntityFn<SongTagBlueprint>>>({
            selection: {},
            entity: { songId: 1, tagId: "trippy" },
        });
    });
});

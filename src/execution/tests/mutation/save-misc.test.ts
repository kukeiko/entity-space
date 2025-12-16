import { Artist, Song, SongBlueprint } from "@entity-space/elements/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { EntityWorkspace } from "../../entity-workspace";
import { CreateEntityFn } from "../../mutation/entity-mutation-function.type";
import { TestFacade, TestRepository } from "../../testing";
import { createMetadata } from "../../testing/default-entities";

describe("save()", () => {
    let facade: TestFacade;
    let repository: TestRepository;
    let workspace: EntityWorkspace;

    beforeEach(() => {
        facade = new TestFacade();
        repository = facade.getTestRepository();
        workspace = facade.getWorkspace();
    });

    it("does not create the same entity twice", async () => {
        // arrange
        facade.enableConsoleTracing();
        const metadata = createMetadata(1);

        const artist: Artist = {
            id: 0,
            metadata,
            name: "foo",
            namespace: "dev",
        };

        const songs: Song[] = [
            {
                id: 0,
                albumId: 1,
                artistId: 0,
                artist,
                duration: 100,
                metadata,
                name: "bar",
                namespace: "dev",
            },
            {
                id: 0,
                albumId: 1,
                artistId: 0,
                artist,
                duration: 100,
                metadata,
                name: "baz",
                namespace: "dev",
            },
        ];

        const expectedArtist: Artist = {
            id: 1,
            metadata,
            name: "foo",
            namespace: "dev",
        };

        const expected: Song[] = [
            {
                id: 1,
                albumId: 1,
                artistId: 1,
                artist: expectedArtist,
                duration: 100,
                metadata,
                name: "bar",
                namespace: "dev",
            },
            {
                id: 2,
                albumId: 1,
                artistId: 1,
                artist: expectedArtist,
                duration: 100,
                metadata,
                name: "baz",
                namespace: "dev",
            },
        ];

        const createSong = repository.useCreateSong();
        const createArtist = repository.useCreateArtist();

        // act
        const actual = await workspace.in(SongBlueprint).select({ artist: true }).save(songs);

        // assert
        expect(actual).toEqual(expected);
        expect(createSong).toHaveBeenCalledTimes(2);
        expect(createArtist).toHaveBeenCalledTimes(1);
        expect(createSong).toHaveBeenCalledWith<Parameters<CreateEntityFn<SongBlueprint>>>({
            selection: {},
            entity: { albumId: 1, artistId: 1, duration: 100, metadata, name: "bar", namespace: "dev" },
        });
        expect(createSong).toHaveBeenCalledWith<Parameters<CreateEntityFn<SongBlueprint>>>({
            selection: {},
            entity: { albumId: 1, artistId: 1, duration: 100, metadata, name: "bar", namespace: "dev" },
        });
    });
});

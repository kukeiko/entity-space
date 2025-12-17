import { Artist, Song, SongBlueprint } from "@entity-space/elements/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { EntityWorkspace } from "../../entity-workspace";
import { TestFacade, TestRepository } from "../../testing";
import { createMetadata } from "../../testing/default-entities";

describe("delete()", () => {
    let facade: TestFacade;
    let repository: TestRepository;
    let workspace: EntityWorkspace;

    beforeEach(() => {
        facade = new TestFacade();
        repository = facade.getTestRepository();
        workspace = facade.getWorkspace();
    });

    it("does not delete the same entity twice", async () => {
        // arrange
        const metadata = createMetadata(1);

        const artist: Artist = {
            id: 1,
            metadata,
            name: "foo",
            namespace: "dev",
        };

        const songs: Song[] = [
            {
                id: 1,
                albumId: 1,
                artistId: 1,
                artist,
                duration: 100,
                metadata,
                name: "bar",
                namespace: "dev",
            },
            {
                id: 2,
                albumId: 1,
                artistId: 1,
                artist,
                duration: 100,
                metadata,
                name: "baz",
                namespace: "dev",
            },
        ];

        const deleteSong = repository.useDeleteSong();
        const deleteArtist = repository.useDeleteArtist();

        // act
        await workspace.in(SongBlueprint).select({ artist: true }).delete(songs);

        // assert
        expect(deleteSong).toHaveBeenCalledTimes(2);
        expect(deleteArtist).toHaveBeenCalledTimes(1);
    });
});

import { Song, SongBlueprint } from "@entity-space/elements/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { EntityWorkspace } from "../../entity-workspace";
import { TestFacade, TestRepository } from "../../testing";

describe("prepareDelete()", () => {
    let facade: TestFacade;
    let repository: TestRepository;
    let workspace: EntityWorkspace;

    beforeEach(() => {
        facade = new TestFacade();
        repository = facade.getTestRepository();
        workspace = facade.getWorkspace();
    });

    it("should delete 2x root entities", async () => {
        // arrange
        const songs: Song[] = [
            facade.construct(SongBlueprint, { id: 1, namespace: "dev" }),
            facade.construct(SongBlueprint, { id: 2, namespace: "dev" }),
        ];

        const deleteSong = repository.useMusic().useDeleteSong();
        repository.useMusic().useEntities({ songs });

        // act
        const changeset = workspace.in(SongBlueprint).prepareDelete(songs);
        const summary = await changeset.execute();

        // assert
        expect(deleteSong).toHaveBeenCalledTimes(2);
        expect(summary.status).toEqual("succeeded");
        expect(changeset.getPrevious()).toEqual([]);
    });

    it("should keep root entities that failed to delete as previous", async () => {
        // arrange
        const songs: Song[] = [
            facade.construct(SongBlueprint, { id: 1, namespace: "dev" }),
            facade.construct(SongBlueprint, { id: 2, namespace: "dev" }),
            facade.construct(SongBlueprint, { id: 3, namespace: "dev" }),
            facade.construct(SongBlueprint, { id: 4, namespace: "dev" }),
        ];

        const deleteSong = repository.useMusic().useDeleteSongIfOddId();
        repository.useMusic().useEntities({ songs });

        // act
        const changeset = workspace.in(SongBlueprint).prepareDelete(songs);
        const summary = await changeset.execute();

        // assert
        expect(deleteSong).toHaveBeenCalledTimes(4);
        expect(summary.status).toEqual("partial");
        expect(summary.failed.map(item => item.entity.id)).toEqual([2, 4]);
        expect(summary.failed[0].error).toEqual(new Error("can only delete entities w/ odd id"));
        expect(changeset.getPrevious()).toEqual([songs[1], songs[3]]);
    });

    it("should only retry deleting the entities that failed", async () => {
        // arrange
        const songs: Song[] = [
            facade.construct(SongBlueprint, { id: 1, namespace: "dev" }),
            facade.construct(SongBlueprint, { id: 2, namespace: "dev" }),
        ];

        const deleteSong = repository.useMusic().useDeleteSongIfOddId();
        repository.useMusic().useEntities({ songs });
        const changeset = workspace.in(SongBlueprint).prepareDelete(songs);
        await changeset.execute();
        deleteSong.mockClear();

        // act
        const summary = await changeset.execute();

        // assert
        expect(deleteSong).toHaveBeenCalledTimes(1);
        expect(deleteSong).toHaveBeenCalledWith(expect.objectContaining({ entity: songs[1] }));
        expect(summary.status).toEqual("failed");
        expect(changeset.getPrevious()).toEqual([songs[1]]);
    });
});

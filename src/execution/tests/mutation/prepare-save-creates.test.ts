import { Song, SongBlueprint } from "@entity-space/elements/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { EntityWorkspace } from "../../entity-workspace";
import { TestFacade, TestRepository } from "../../testing";

describe("prepareSave(): creates", () => {
    let facade: TestFacade;
    let repository: TestRepository;
    let workspace: EntityWorkspace;

    beforeEach(() => {
        facade = new TestFacade();
        repository = facade.getTestRepository();
        workspace = facade.getWorkspace();
    });

    it("should create 2x root entities without modifying the given entities", async () => {
        // arrange
        const songs: Song[] = [
            facade.construct(SongBlueprint, { namespace: "dev", name: "a" }),
            facade.construct(SongBlueprint, { namespace: "dev", name: "b" }),
        ];

        const songsBefore = structuredClone(songs);
        const createSong = repository.useMusic().useCreateSong();

        // act
        const changeset = workspace.in(SongBlueprint).prepareSave(songs);
        const summary = await changeset.execute();

        // assert
        const expected = [
            { ...songs[0], id: 1 },
            { ...songs[1], id: 2 },
        ];

        expect(createSong).toHaveBeenCalledTimes(2);
        expect(summary.status).toEqual("succeeded");
        expect(changeset.getNext()).toEqual(expected);
        expect(changeset.getPrevious()).toEqual(expected);
        expect(songs).toEqual(songsBefore);
    });
});

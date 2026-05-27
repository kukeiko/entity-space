import { Song, SongBlueprint, Tag, TagBlueprint } from "@entity-space/elements/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { EntityWorkspace } from "../../entity-workspace";
import { TestFacade, TestRepository } from "../../testing";

describe("hydrate array", () => {
    let facade: TestFacade;
    let repository: TestRepository;
    let workspace: EntityWorkspace;

    beforeEach(() => {
        facade = new TestFacade();
        repository = facade.getTestRepository();
        workspace = facade.getWorkspace();
    });

    it("with a source that returns all", async () => {
        // arrange
        const tagIds = ["upbeat", "melodic"];
        const song: Song = workspace.from(SongBlueprint).construct({ tagIds });
        const tags: Tag[] = [
            workspace.from(TagBlueprint).construct({ id: "upbeat" }),
            workspace.from(TagBlueprint).construct({ id: "techno" }),
            workspace.from(TagBlueprint).construct({ id: "melodic" }),
        ];
        const expectedTags: Tag[] = tags.filter(tag => tagIds.includes(tag.id));

        repository.useMusic().useEntities({ songs: [song], tags });
        repository.useMusic().useLoadAllTags();

        // act
        await workspace.for(SongBlueprint).select({ tags: true }).hydrateOne(song);

        // assert
        expect(song.tags).toEqual(expectedTags);
    });

    it("should hydrate array by id and joined ids is array", async () => {
        // arrange
        const tagId = "upbeat";
        const tag = workspace.from(TagBlueprint).construct({ id: tagId });
        const songs: Song[] = [
            workspace.from(SongBlueprint).construct({ id: 1, tagIds: [tagId] }),
            workspace.from(SongBlueprint).construct({ id: 2, tagIds: ["melodic"] }),
            workspace.from(SongBlueprint).construct({ id: 3, tagIds: [tagId] }),
        ];

        const expectedSongs = songs.filter(song => song.tagIds?.includes(tagId));

        repository.useMusic().useEntities({ tags: [tag], songs });
        repository.useMusic().useLoadAllSongs();

        // act
        await workspace.for(TagBlueprint).select({ songs: true }).hydrateOne(tag);

        // assert
        expect(tag.songs).toEqual(expectedSongs);
    });
});

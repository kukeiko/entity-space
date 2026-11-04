import { Album, AlbumBlueprint, Song, SongBlueprint } from "@entity-space/elements/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { EntityWorkspace } from "../../entity-workspace";
import { DeleteEntityFn, UpdateEntityFn } from "../../mutation/entity-mutation-function.type";
import { TestFacade, TestRepository } from "../../testing";

describe("sync()", () => {
    let facade: TestFacade;
    let repository: TestRepository;
    let workspace: EntityWorkspace;

    beforeEach(() => {
        facade = new TestFacade();
        repository = facade.getTestRepository();
        workspace = facade.getWorkspace();
    });

    it("should not delete inbound relations if they've moved to another root entity", async () => {
        // arrange
        const deleteAlbum = repository.useMusic().useDeleteAlbum();
        const updateSong = repository.useMusic().useUpdateSong();
        const deleteSong = repository.useMusic().useDeleteSong();

        const deletedAlbum = facade.construct(AlbumBlueprint, { id: 1, namespace: "dev" });
        const keptAlbum = facade.construct(AlbumBlueprint, { id: 2, namespace: "dev" });

        // this one moves to the other album
        const movedSong = facade.construct(SongBlueprint, { id: 10, namespace: "dev", albumId: 1 });

        const updatedSong: Song = {
            ...movedSong,
            albumId: 2,
        };

        // this one gets deleted
        const deletedSong: Song = {
            ...facade.constructDefault(SongBlueprint),
            id: 20,
            namespace: "dev",
            albumId: 1,
        };

        const previousAlbums: Album[] = [
            { ...deletedAlbum, songs: [{ ...movedSong }, { ...deletedSong }] },
            { ...keptAlbum, songs: [] },
        ];

        const nextAlbums: Album[] = [{ ...keptAlbum, songs: [{ ...movedSong }] }];

        // act
        await workspace.in(AlbumBlueprint).select({ songs: true }).sync(nextAlbums, previousAlbums);

        // assert
        expect(deleteAlbum).toHaveBeenCalledTimes(1);
        expect(deleteAlbum).toHaveBeenCalledAfter(deleteSong);
        expect(updateSong).toHaveBeenCalledWith<Parameters<UpdateEntityFn<SongBlueprint>>>({
            entity: { ...updatedSong },
            selection: {},
            context: expect.anything(),
        });

        expect(deleteSong).toHaveBeenCalledTimes(1);
        expect(deleteSong).toHaveBeenCalledWith<Parameters<DeleteEntityFn<SongBlueprint>>>({
            entity: { ...deletedSong },
            selection: {},
            context: expect.anything(),
        });
    });
});

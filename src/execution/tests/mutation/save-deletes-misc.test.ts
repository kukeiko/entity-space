import {
    Album,
    AlbumBlueprint,
    Item,
    ItemBlueprint,
    ItemSocket,
    ItemSocketBlueprint,
    Song,
    SongBlueprint,
} from "@entity-space/elements/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { EntityWorkspace } from "../../entity-workspace";
import { DeleteEntitiesFn, DeleteEntityFn, UpdateEntityFn } from "../../mutation/entity-mutation-function.type";
import { TestFacade, TestRepository } from "../../testing";

describe("save()", () => {
    let facade: TestFacade;
    let repository: TestRepository;
    let workspace: EntityWorkspace;

    beforeEach(() => {
        facade = new TestFacade();
        repository = facade.getTestRepository();
        workspace = facade.getWorkspace();
    });

    describe("should delete inbound relation only if a relation value is provided", () => {
        it("relation value is provided", async () => {
            // arrange
            const deleteItemSocket = repository.useRpg().useDeleteItemSockets();

            const windforce: Item = {
                ...facade.constructDefault(ItemBlueprint),
                id: 1,
                name: "Windforce",
                sockets: [], // empty array is explicitly provided, expecting the previous sockets to be deleted
            };

            const deletedSocket: ItemSocket = {
                ...facade.constructDefault(ItemSocketBlueprint),
                id: 2,
                itemId: 1,
            };

            const windforcePrevious: Item = {
                ...facade.constructDefault(ItemBlueprint),
                id: 1,
                name: "Windforce",
                sockets: [{ ...deletedSocket }],
            };

            // act
            await workspace.in(ItemBlueprint).select({ sockets: true }).save([windforce], [windforcePrevious]);

            // assert
            expect(deleteItemSocket).toHaveBeenCalledWith<Parameters<DeleteEntitiesFn<ItemSocketBlueprint>>>({
                entities: [{ ...deletedSocket }],
                selection: {},
            });
        });

        it("relation value is omitted", async () => {
            // arrange
            const deleteItemSocket = repository.useRpg().useDeleteItemSockets();

            // no sockets array is provided -> no sockets should be deleted
            const windforce: Item = {
                ...facade.constructDefault(ItemBlueprint),
                id: 1,
                name: "Windforce",
            };

            const deletedSocket: ItemSocket = {
                ...facade.constructDefault(ItemSocketBlueprint),
                id: 2,
                itemId: 1,
            };

            const windforcePrevious: Item = {
                ...facade.constructDefault(ItemBlueprint),
                id: 1,
                name: "Windforce",
                sockets: [{ ...deletedSocket }],
            };

            // act
            await workspace.in(ItemBlueprint).select({ sockets: true }).save([windforce], [windforcePrevious]);

            // assert
            expect(deleteItemSocket).not.toHaveBeenCalled();
        });
    });

    it("should not delete inbound relations if they've moved to another entity", async () => {
        // arrange
        const deleteAlbum = repository.useMusic().useDeleteAlbum();
        const updateSong = repository.useMusic().useUpdateSong();
        const deleteSong = repository.useMusic().useDeleteSong();

        const deletedAlbum: Album = {
            ...facade.constructDefault(AlbumBlueprint),
            id: 1,
            namespace: "dev",
        };

        const keptAlbum: Album = {
            ...facade.constructDefault(AlbumBlueprint),
            id: 2,
            namespace: "dev",
        };

        // this one moves to the other album
        const movedSong: Song = {
            ...facade.constructDefault(SongBlueprint),
            id: 10,
            namespace: "dev",
            albumId: 1,
        };

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

        const nextAlbums: Album[] = [{ ...keptAlbum, songs: [{ ...movedSong, albumId: 2 }] }];

        // act
        await workspace.in(AlbumBlueprint).select({ songs: true }).save(nextAlbums, previousAlbums);

        // assert
        expect(deleteAlbum).toHaveBeenCalledTimes(1);
        expect(deleteAlbum).toHaveBeenCalledAfter(deleteSong);
        expect(updateSong).toHaveBeenCalledWith<Parameters<UpdateEntityFn<SongBlueprint>>>({
            entity: { ...updatedSong },
            selection: {},
        });

        expect(deleteSong).toHaveBeenCalledTimes(1);
        expect(deleteSong).toHaveBeenCalledWith<Parameters<DeleteEntityFn<SongBlueprint>>>({
            entity: { ...deletedSong },
            selection: {},
        });
    });
});

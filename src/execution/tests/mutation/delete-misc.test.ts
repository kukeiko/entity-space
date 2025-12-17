import { Artist, Item, ItemBlueprint, Song, SongBlueprint } from "@entity-space/elements/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { EntityWorkspace } from "../../entity-workspace";
import { TestFacade, TestRepository } from "../../testing";
import { createMetadata } from "../../testing/create-metadata.fn";

describe("delete()", () => {
    let facade: TestFacade;
    let repository: TestRepository;
    let workspace: EntityWorkspace;

    const createdAt = new Date().toISOString();
    const updatedAt = new Date(Date.now() + 1000).toISOString();

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

        const deleteSong = repository.useMusic().useDeleteSong();
        const deleteArtist = repository.useMusic().useDeleteArtist();

        // act
        await workspace.in(SongBlueprint).select({ artist: true }).delete(songs);

        // assert
        expect(deleteSong).toHaveBeenCalledTimes(2);
        expect(deleteArtist).toHaveBeenCalledTimes(1);
    });

    it("should work", async () => {
        // arrange
        const windforce: Item = {
            id: 1,
            assignId: 1,
            typeId: 7,
            attributes: [
                {
                    typeId: 10,
                    values: [40],
                    type: {
                        id: 10,
                        assignId: 10,
                        name: "Increased Attack Speed",
                        createdAt,
                        updatedAt,
                    },
                },
            ],
            name: "Windforce",
            createdAt,
            updatedAt,
            sockets: [
                {
                    id: 2,
                    assignId: 2,
                    itemId: 0,
                    socketedItemId: 0,
                    createdAt,
                    updatedAt,
                },
                {
                    id: 3,
                    assignId: 3,
                    itemId: 0,
                    socketedItemId: 300,
                    createdAt,
                    updatedAt,
                },
            ],
        };

        const deleteItems = repository.useRpg().useDeleteItems();
        const deleteItemSockets = repository.useRpg().useDeleteItemSockets();
        const deleteItemAttributeTypes = repository.useRpg().useDeleteItemAttributeTypes();

        // act
        await workspace
            .in(ItemBlueprint)
            .select({ sockets: true, attributes: { type: true } })
            .delete([windforce]);

        // assert
        expect(deleteItems).toHaveBeenCalledTimes(1);
        expect(deleteItems).toHaveBeenCalledWith({
            entities: [
                {
                    id: 1,
                    assignId: 1,
                    typeId: 7,
                    attributes: [{ typeId: 10, values: [40] }],
                    name: "Windforce",
                    createdAt,
                    updatedAt,
                },
            ],
            selection: {},
        });

        expect(deleteItemSockets).toHaveBeenCalledTimes(1);
        expect(deleteItemSockets).toHaveBeenCalledWith({
            entities: [
                {
                    id: 2,
                    assignId: 2,
                    itemId: 0,
                    socketedItemId: 0,
                    createdAt,
                    updatedAt,
                },
                {
                    id: 3,
                    assignId: 3,
                    itemId: 0,
                    socketedItemId: 300,
                    createdAt,
                    updatedAt,
                },
            ],
            selection: {},
        });

        expect(deleteItemAttributeTypes).toHaveBeenCalledTimes(1);
        expect(deleteItemAttributeTypes).toHaveBeenCalledWith({
            entities: [
                {
                    id: 10,
                    assignId: 10,
                    name: "Increased Attack Speed",
                    createdAt,
                    updatedAt,
                },
            ],
            selection: {},
        });
    });
});

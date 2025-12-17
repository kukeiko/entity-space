import {
    Artist,
    Item,
    ItemAttributeType,
    ItemAttributeTypeCreatable,
    ItemBlueprint,
    ItemSavable,
    ItemSocket,
    ItemUpdatable,
    Song,
    SongBlueprint,
} from "@entity-space/elements/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { EntityWorkspace } from "../../entity-workspace";
import { CreateEntityFn } from "../../mutation/entity-mutation-function.type";
import { TestFacade, TestRepository } from "../../testing";
import { createMetadata } from "../../testing/default-entities";

describe("save()", () => {
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

    it("does not create the same entity twice", async () => {
        // arrange
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

    describe("does not update the same entity twice", () => {
        it("without previous entities", async () => {
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

            const updateSong = repository.useUpdateSong();
            const updateArtist = repository.useUpdateArtist();

            // act
            await workspace.in(SongBlueprint).select({ artist: true }).save(songs);

            // assert
            expect(updateSong).toHaveBeenCalledTimes(2);
            expect(updateArtist).toHaveBeenCalledTimes(1);
        });

        it("with previous entities", async () => {
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

            const updatedArtist = structuredClone(artist);
            const updatedSongs = structuredClone(songs);

            updatedArtist.name = `${updatedArtist.name} (updated)`;

            for (const song of updatedSongs) {
                song.artist = updatedArtist;
                song.name = `${song.name} (updated)`;
            }

            const updateSong = repository.useUpdateSong();
            const updateArtist = repository.useUpdateArtist();

            // act
            await workspace.in(SongBlueprint).select({ artist: true }).save(updatedSongs, songs);

            // assert
            expect(updateSong).toHaveBeenCalledTimes(2);
            expect(updateArtist).toHaveBeenCalledTimes(1);
        });
    });

    it("should recognize changes on embedded arrays", async () => {
        const updateItems = repository.useUpdateItems(updatedAt);

        // arrange
        const windforceOriginal: Item = {
            id: 1,
            assignId: 1,
            typeId: 7,
            createdAt,
            updatedAt,
            attributes: [
                { typeId: 1, values: [40] }, // this will change
                { typeId: 2, values: [100] },
                { typeId: 3, values: [50] }, // this will change
            ],
            name: "Windforce",
            sockets: [],
        };

        const windforceChanged: Item = {
            id: 1,
            assignId: 1,
            typeId: 7,
            createdAt,
            updatedAt,
            attributes: [
                { typeId: 1, values: [30] }, // this has changed
                { typeId: 2, values: [100] },
                { typeId: 3, values: [60] }, // this has changed
            ],
            name: "Windforce",
            sockets: [],
        };

        const windforcePassedToUpdate: ItemUpdatable = {
            id: 1,
            name: "Windforce",
            typeId: 7,
            attributes: [
                { typeId: 1, values: [30] },
                { typeId: 2, values: [100] },
                { typeId: 3, values: [60] },
            ],
        };

        // act
        await workspace.in(ItemBlueprint).save([windforceChanged], [windforceOriginal]);

        // assert
        expect(updateItems).toHaveBeenCalledWith({
            entities: [windforcePassedToUpdate],
            selection: {},
        });
    });

    it("should do nothing if there is no difference in updatable changes", async () => {
        // arrange
        const updateItems = repository.useUpdateItems(updatedAt);
        const updateItemSockets = repository.useUpdateItemSockets(updatedAt);

        const windforce: Item = {
            id: 1,
            assignId: 1,
            typeId: 7,
            createdAt,
            updatedAt,
            attributes: [
                {
                    typeId: 1,
                    values: [40],
                    type: {
                        id: 1,
                        assignId: 1,
                        // introducing a change in an entity that is not selected and should therefore not cause a change
                        name: "Increased Attack Speed (changed)",
                        createdAt,
                        updatedAt,
                    },
                },
            ],
            name: "Windforce",
            sockets: [
                {
                    id: 2,
                    assignId: 2,
                    createdAt,
                    itemId: 1,
                    socketedItemId: 4,
                    updatedAt,
                },
            ],
        };

        const windforcePrevious: Item = {
            id: 1,
            assignId: 1,
            typeId: 7,
            createdAt,
            updatedAt,
            attributes: [
                {
                    typeId: 1,
                    values: [40],
                    type: {
                        id: 1,
                        assignId: 1,
                        name: "Increased Attack Speed",
                        createdAt,
                        updatedAt,
                    },
                },
            ],
            name: "Windforce",
            sockets: [
                {
                    id: 2,
                    assignId: 2,
                    createdAt,
                    itemId: 1,
                    socketedItemId: 4,
                    updatedAt,
                },
            ],
        };

        // act
        await workspace.in(ItemBlueprint).save([windforce], [windforcePrevious]);

        // assert
        expect(updateItems).not.toHaveBeenCalled();
        expect(updateItemSockets).not.toHaveBeenCalled();
    });

    it("should work (complex)", async () => {
        // arrange
        const plusToAllSkills: ItemAttributeTypeCreatable = { assignId: 1, name: "+X to all Skills" };
        const increasedAttackSpeed: ItemAttributeTypeCreatable = { assignId: 2, name: "Increased Attack Speed" };
        const enhancedDamage: ItemAttributeTypeCreatable = { assignId: 5, name: "Enhanced Damage" };

        // will always be updated because it does not exist on an item in "previous" causing no diff to be created for it
        // that could be used to understand any changes made to it
        const plusStrength: ItemAttributeType = {
            id: 3,
            assignId: 3,
            name: "+ to Strength",
            createdAt,
            updatedAt: null,
        };

        const increasedLife: ItemAttributeType = {
            id: 4,
            assignId: 4,
            name: "+% Increased Life",
            createdAt,
            updatedAt: null,
        };

        const istRuneSocket: ItemSocket = {
            id: 4,
            assignId: 4,
            createdAt,
            updatedAt,
            itemId: 3,
            socketedItemId: 400,
        };

        const windforce: ItemSavable = {
            assignId: 1,
            typeId: 7,
            attributes: [
                { type: increasedAttackSpeed, values: [40] },
                { type: plusStrength, values: [20] },
            ],
            name: "Windforce",
            sockets: [
                {
                    // this socket will be created
                    assignId: 2,
                    itemId: 0, // will be set to "1" before creation
                    socketedItemId: 0,
                    socketedItem: {
                        // this item will be created
                        assignId: 10,
                        typeId: 13,
                        name: "Ruby Jewel of Fervor",
                        attributes: [
                            {
                                type: increasedAttackSpeed,
                                values: [15],
                            },
                            {
                                type: enhancedDamage,
                                values: [40],
                            },
                        ],
                    },
                },
                {
                    // this socket will be updated because it does not exist in "previous"
                    id: 3,
                    assignId: 3,
                    itemId: 0, // will be set to "1" before update
                    socketedItemId: 300, // [todo] ❌ add socketed item that is moved from another item
                },
                istRuneSocket,
            ],
        };

        const shako: ItemSavable = {
            id: 2,
            name: "Shako 1.09",
            attributes: [
                {
                    values: [2],
                    type: plusToAllSkills, // "type" will be created, and we expect "typeId" to be assigned after
                },
            ],
            sockets: [],
        };

        const previousShako: Item = {
            id: 2,
            assignId: 2,
            typeId: 7,
            name: "Shako 1.08",
            attributes: [
                {
                    typeId: increasedLife.id,
                    type: increasedLife,
                    values: [40],
                },
            ],
            sockets: [
                // this socket will be deleted
                { id: 21, assignId: 21, itemId: 2, socketedItemId: 300, createdAt, updatedAt },
            ],
            createdAt,
            updatedAt,
        };

        // will be deleted
        const wizardSpike: Item = {
            id: 3,
            assignId: 2,
            typeId: 7,
            name: "Wizardspike",
            attributes: [],
            sockets: [structuredClone(istRuneSocket)],
            createdAt,
            updatedAt,
        };

        const items: ItemSavable[] = [windforce, shako];
        const previous: Item[] = [previousShako, wizardSpike];

        const createItems = repository.useCreateItems(createdAt);
        const updateItems = repository.useUpdateItems(updatedAt);
        const deleteItems = repository.useDeleteItems();
        const createItemSockets = repository.useCreateItemSockets(createdAt);
        const updateItemSockets = repository.useUpdateItemSockets(updatedAt);
        const deleteItemSocket = repository.useDeleteItemSockets();
        const createItemAttributeTypes = repository.useCreateItemAttributeTypes(createdAt);
        const updateItemAttributeTypes = repository.useUpdateItemAttributeTypes(updatedAt);
        const deleteItemAttributeTypes = repository.useDeleteItemAttributeTypes();

        // act
        await workspace
            .in(ItemBlueprint)
            .select({ sockets: { socketedItem: { attributes: { type: true } } }, attributes: { type: true } })
            .save(items, previous);

        // assert
        // Item
        {
            expect(createItems).toHaveBeenCalledTimes(2);
            expect(createItems).toHaveBeenCalledWith({
                entities: [
                    {
                        assignId: 1,
                        typeId: 7,
                        name: "Windforce",
                        attributes: [
                            { typeId: 2, values: [40] },
                            { typeId: 3, values: [20] },
                        ],
                    },
                ],
                selection: {},
            });
            expect(createItems).toHaveBeenCalledWith({
                entities: [
                    {
                        assignId: 10,
                        typeId: 13,
                        name: "Ruby Jewel of Fervor",
                        attributes: [
                            { values: [15], typeId: 2 },
                            { values: [40], typeId: 5 },
                        ],
                    },
                ],
                selection: {},
            });
            expect(updateItems).toHaveBeenCalledTimes(1);
            expect(updateItems).toHaveBeenCalledWith({
                entities: [{ id: 2, name: "Shako 1.09", attributes: [{ values: [2], typeId: 1 }] }],
                selection: {},
            });
            expect(deleteItems).toHaveBeenCalledTimes(1);
            expect(deleteItems).toHaveBeenCalledWith({
                entities: [
                    {
                        id: 3,
                        assignId: 2,
                        typeId: 7,
                        name: "Wizardspike",
                        attributes: [],
                        createdAt,
                        updatedAt,
                    },
                ],
                selection: {},
            });
        }

        // ItemSocket
        {
            expect(createItemSockets).toHaveBeenCalledTimes(1);
            expect(createItemSockets).toHaveBeenCalledWith({
                entities: [{ assignId: 2, itemId: 1, socketedItemId: 10 }],
                selection: {},
            });
            expect(updateItemSockets).toHaveBeenCalledTimes(1);
            expect(updateItemSockets).toHaveBeenCalledWith({
                entities: [
                    { id: 3, itemId: 1, socketedItemId: 300 },
                    { id: 4, itemId: 1, socketedItemId: 400 },
                ],
                selection: {},
            });
            expect(deleteItemSocket).toHaveBeenCalledTimes(1);
            expect(deleteItemSocket).toHaveBeenCalledWith({
                entities: [{ id: 21, assignId: 21, itemId: 2, socketedItemId: 300, createdAt, updatedAt }],
                selection: {},
            });
        }

        // ItemAttributeType
        {
            expect(createItemAttributeTypes).toHaveBeenCalledTimes(2);
            expect(createItemAttributeTypes).toHaveBeenCalledWith({
                entities: [
                    { assignId: 2, name: "Increased Attack Speed" },
                    { assignId: 1, name: "+X to all Skills" },
                ],
                selection: {},
            });
            expect(createItemAttributeTypes).toHaveBeenCalledWith({
                entities: [{ assignId: 5, name: "Enhanced Damage" }],
                selection: {},
            });
            expect(updateItemAttributeTypes).toHaveBeenCalledTimes(1);
            expect(updateItemAttributeTypes).toHaveBeenCalledWith({
                entities: [{ id: 3, name: "+ to Strength" }],
                selection: {},
            });
            expect(deleteItemAttributeTypes).not.toHaveBeenCalled();
        }
    });
});

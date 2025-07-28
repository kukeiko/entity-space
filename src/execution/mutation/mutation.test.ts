import {
    Item,
    ItemAttributeType,
    ItemAttributeTypeCreatable,
    ItemBlueprint,
    ItemSavable,
    ItemSocket,
    ItemUpdatable,
} from "@entity-space/elements/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { EntityWorkspace } from "../entity-workspace";
import { TestFacade, TestRepository } from "../testing";

describe("mutation", () => {
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

    describe("save", () => {
        it("save one entity", async () => {
            // arrange
            const windforce: ItemSavable = {
                assignId: 1,
                attributes: [],
                name: "Windforce",
                sockets: [],
            };

            const windforcePassedToSave: ItemSavable = {
                assignId: 1,
                attributes: [],
                name: "Windforce",
                sockets: [],
            };

            const windforceSaved: Item = {
                id: 1,
                assignId: 1,
                attributes: [],
                createdAt,
                name: "Windforce",
                updatedAt,
                sockets: [],
            };

            const saveItem = repository.useSaveItems(createdAt, updatedAt);

            // act
            const saved = await workspace.in(ItemBlueprint).select({ sockets: true }).save([windforce]);
            console.dir(saved, { depth: null });

            // assert
            expect(saveItem).toHaveBeenCalledWith({ entities: [windforcePassedToSave], selection: { sockets: true } });
            expect(saved).toEqual([windforceSaved]);
            expect(saved[0]).toBe(windforce);
        });

        describe("should recognize changes", () => {
            it("on embedded arrays", async () => {
                const updateItems = repository.useUpdateItems(updatedAt);

                // arrange
                const windforceOriginal: Item = {
                    id: 1,
                    assignId: 1,
                    createdAt,
                    updatedAt,
                    attributes: [
                        {
                            typeId: 1,
                            values: [40],
                        },
                        {
                            typeId: 2,
                            values: [100],
                        },
                        {
                            typeId: 3,
                            values: [50],
                        },
                    ],
                    name: "Windforce",
                    sockets: [],
                };

                const windforceChanged: Item = {
                    id: 1,
                    assignId: 1,
                    createdAt,
                    updatedAt,
                    attributes: [
                        {
                            typeId: 1,
                            values: [30],
                        },
                        {
                            typeId: 2,
                            values: [100],
                        },
                        {
                            typeId: 3,
                            values: [60],
                        },
                    ],
                    name: "Windforce",
                    sockets: [],
                };

                const windforcePassedToUpdate: ItemUpdatable = {
                    id: 1,
                    name: "Windforce",
                    attributes: [
                        {
                            typeId: 1,
                            values: [30],
                        },
                        {
                            typeId: 2,
                            values: [100],
                        },
                        {
                            typeId: 3,
                            values: [60],
                        },
                    ],
                };

                // act
                await workspace.in(ItemBlueprint).save([windforceChanged], [windforceOriginal]);

                // assert
                expect(updateItems).toHaveBeenCalledWith({ entities: [windforcePassedToUpdate], selection: {} });
            });
        });

        it("should do nothing if there is no difference in updatable changes", async () => {
            // arrange
            const updateItems = repository.useUpdateItems(updatedAt);
            const updateItemSockets = repository.useUpdateItemSockets(updatedAt);

            const windforce: Item = {
                id: 1,
                assignId: 1,
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

        describe("should delete children only if empty array is provided explicitly", () => {
            it("empty array is provided", async () => {
                {
                    // arrange
                    const deleteItemSocket = repository.useDeleteItemSockets();

                    const windforce: ItemUpdatable = {
                        id: 1,
                        name: "Windforce",
                        sockets: [], // empty array is explicitly provided, expecting the previous sockets to be deleted
                    };

                    const windforcePrevious: Item = {
                        id: 1,
                        assignId: 1,
                        createdAt,
                        updatedAt,
                        attributes: [],
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
                    await workspace.in(ItemBlueprint).select({ sockets: true }).save([windforce], [windforcePrevious]);

                    // assert
                    expect(deleteItemSocket).toHaveBeenCalledWith({
                        entities: [
                            {
                                id: 2,
                                assignId: 2,
                                createdAt,
                                itemId: 1,
                                socketedItemId: 4,
                                updatedAt,
                            },
                        ],
                        selection: {},
                    });
                }
            });

            // [todo] ❌ doesn't work yet
            it("empty array is omitted", async () => {
                {
                    // arrange
                    const deleteItemSocket = repository.useDeleteItemSockets();

                    const windforce: ItemUpdatable = {
                        id: 1,
                        name: "Windforce",
                        // no sockets array is provided -> no sockets should be deleted
                    };

                    const windforcePrevious: Item = {
                        id: 1,
                        assignId: 1,
                        createdAt,
                        updatedAt,
                        attributes: [],
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
                    await workspace.in(ItemBlueprint).select({ sockets: true }).save([windforce], [windforcePrevious]);

                    // assert
                    expect(deleteItemSocket).not.toHaveBeenCalled();
                }
            });
        });

        it("should work (complex)", async () => {
            /**
             * This test is covering a lot at of save() use cases at once.
             */
            // [todo] ❌ how can we say that we want the typeId to be updated, but not by setting it directly;
            // instead, entity-space should see the "type" reference and take its id and write it to typeId?
            // => I think we should just - in the workspace maybe, in the mutate call - call a new function
            // that goes through all selected entities and assigns ids from related entities.
            // Or - even just do it in the update mutator directly.

            // arrange
            const plusToAllSkills: ItemAttributeTypeCreatable = { assignId: 1, name: "+X to all Skills" };
            const increasedAttackSpeed: ItemAttributeTypeCreatable = { assignId: 2, name: "Increased Attack Speed" };
            const enhancedDamage: ItemAttributeTypeCreatable = { assignId: 5, name: "Enhanced Damage" };

            // will be updated because it does not exist on an item in "previous" causing no diff to be created for it
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
                        // this socket will be updated
                        id: 3,
                        assignId: 3,
                        itemId: 0, // will be set to "1" before update
                        socketedItemId: 300, // [todo] ❌ add socket item that is moved from another item
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
                name: "Wizardspike",
                attributes: [],
                sockets: [structuredClone(istRuneSocket)],
                createdAt,
                updatedAt,
            };

            const items: ItemSavable[] = [windforce, shako];
            const itemsBeforeMutate = structuredClone(items);
            const previous: Item[] = [previousShako, wizardSpike];
            const previousBeforeMutate = structuredClone(previous);

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

            console.log("[before mutate]");
            console.dir(itemsBeforeMutate, { depth: null });
            console.log("[after mutate]");
            console.dir(items, { depth: null });
            console.log("[previous before mutate]");
            console.dir(previousBeforeMutate, { depth: null });
            console.log("[previous after mutate]");
            console.dir(previous, { depth: null });

            // assert
            // Item
            {
                expect(createItems).toHaveBeenCalledTimes(2);
                expect(createItems).toHaveBeenCalledWith({
                    entities: [
                        {
                            assignId: 1,
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
                    entities: [
                        {
                            id: 2,
                            name: "Shako 1.09",
                            attributes: [{ values: [2], typeId: 1 }],
                        },
                    ],
                    selection: {},
                });
                expect(deleteItems).toHaveBeenCalledTimes(1);
                expect(deleteItems).toHaveBeenCalledWith({
                    entities: [
                        {
                            id: 3,
                            assignId: 2,
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
                    entities: [
                        {
                            assignId: 2,
                            itemId: 1,
                            socketedItemId: 10,
                        },
                    ],
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
                    entities: [
                        {
                            id: 3,
                            name: "+ to Strength",
                        },
                    ],
                    selection: {},
                });
                expect(deleteItemAttributeTypes).not.toHaveBeenCalled();
            }
        });
    });

    describe("delete", () => {
        it("should work", async () => {
            // arrange
            const windforce: Item = {
                id: 1,
                assignId: 1,
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

            const deleteItems = repository.useDeleteItems();
            const deleteItemSockets = repository.useDeleteItemSockets();
            const deleteItemAttributeTypes = repository.useDeleteItemAttributeTypes();

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

            expect(deleteItemAttributeTypes).not.toHaveBeenCalled();
        });
    });
});

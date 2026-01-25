import {
    Item,
    ItemBlueprint,
    ItemSocket,
    ItemSocketBlueprint,
    ItemType,
    ItemTypeBlueprint,
} from "@entity-space/elements/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { EntityWorkspace } from "../../entity-workspace";
import {
    CreateEntitiesFn,
    DeleteEntitiesFn,
    SaveEntitiesFn,
    UpdateEntitiesFn,
} from "../../mutation/entity-mutation-function.type";
import { TestFacade, TestRepository } from "../../testing";

describe("save() updates one entity", () => {
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

    describe("w/o any relations", () => {
        let windforce: {
            input: Item;
            dispatched: Item;
            output: Item;
        };

        beforeEach(() => {
            windforce = {
                input: {
                    id: 1,
                    assignId: 1,
                    typeId: 7,
                    attributes: [],
                    name: "Windforce",
                    sockets: [],
                    createdAt,
                    updatedAt: null,
                },
                dispatched: {
                    id: 1,
                    assignId: 1,
                    typeId: 7,
                    attributes: [],
                    name: "Windforce",
                    createdAt,
                    updatedAt: null,
                },
                output: {
                    id: 1,
                    assignId: 1,
                    typeId: 7,
                    attributes: [],
                    createdAt,
                    name: "Windforce",
                    sockets: [],
                    updatedAt,
                },
            };
        });

        it("using a save mutator", async () => {
            // arrange
            const saveItems = repository.useRpg().useSaveItems(createdAt, updatedAt);

            // act
            const saved = await workspace.in(ItemBlueprint).save(windforce.input);

            // assert
            expect(saveItems).toHaveBeenCalledWith<Parameters<SaveEntitiesFn<ItemBlueprint>>>({
                entities: [windforce.dispatched],
                selection: {},
            });
            expect(saved).toEqual(windforce.output);
            expect(saved).toBe(windforce.input);
        });

        it("using an update mutator", async () => {
            // arrange
            const updateItems = repository.useRpg().useUpdateItems(updatedAt);

            // act
            const saved = await workspace.in(ItemBlueprint).save(windforce.input);

            // assert
            expect(updateItems).toHaveBeenCalledWith<Parameters<UpdateEntitiesFn<ItemBlueprint>>>({
                entities: [windforce.dispatched],
                selection: {},
            });
            expect(saved).toEqual(windforce.output);
            expect(saved).toBe(windforce.input);
        });
    });

    describe("and create one reference", () => {
        let windforce: {
            input: Item;
            dispatched: {
                item: Item;
                itemType: ItemType;
            };
            output: Item;
        };

        beforeEach(() => {
            windforce = {
                input: {
                    id: 1,
                    assignId: 1,
                    typeId: 0,
                    type: { id: 0, assignId: 7, name: "Hydra Bow" },
                    attributes: [],
                    name: "Windforce",
                    sockets: [],
                    createdAt,
                    updatedAt: null,
                },
                dispatched: {
                    itemType: { id: 0, assignId: 7, name: "Hydra Bow" },
                    item: {
                        id: 1,
                        typeId: 7,
                        attributes: [],
                        name: "Windforce",
                        assignId: 1,
                        createdAt,
                        updatedAt: null,
                    },
                },
                output: {
                    id: 1,
                    assignId: 1,
                    typeId: 7,
                    type: { id: 7, assignId: 7, name: "Hydra Bow" },
                    attributes: [],
                    createdAt,
                    name: "Windforce",
                    sockets: [],
                    updatedAt,
                },
            };
        });

        it("using a save mutator", async () => {
            // arrange
            const saveItems = repository.useRpg().useSaveItems(createdAt, updatedAt);
            const saveItemTypes = repository.useRpg().useSaveItemTypes();

            // act
            const saved = await workspace.in(ItemBlueprint).select({ type: true }).save(windforce.input);

            // assert
            expect(saveItemTypes).toHaveBeenCalledBefore(saveItems);
            expect(saveItemTypes).toHaveBeenCalledWith<Parameters<SaveEntitiesFn<ItemTypeBlueprint>>>({
                entities: [windforce.dispatched.itemType],
                selection: {},
            });
            expect(saveItems).toHaveBeenCalledWith<Parameters<SaveEntitiesFn<ItemBlueprint>>>({
                entities: [windforce.dispatched.item],
                selection: {},
            });
            expect(saved).toEqual(windforce.output);
            expect(saved).toBe(windforce.input);
        });

        it("using an update and a create mutator", async () => {
            // arrange
            const updateItems = repository.useRpg().useUpdateItems(updatedAt);
            const createItemTypes = repository.useRpg().useCreateItemTypes();

            // act
            const saved = await workspace.in(ItemBlueprint).select({ type: true }).save(windforce.input);

            // assert
            expect(createItemTypes).toHaveBeenCalledBefore(updateItems);
            expect(createItemTypes).toHaveBeenCalledWith<Parameters<CreateEntitiesFn<ItemTypeBlueprint>>>({
                entities: [windforce.dispatched.itemType],
                selection: {},
            });
            expect(updateItems).toHaveBeenCalledWith<Parameters<UpdateEntitiesFn<ItemBlueprint>>>({
                entities: [windforce.dispatched.item],
                selection: {},
            });
            expect(saved).toEqual(windforce.output);
            expect(saved).toBe(windforce.input);
        });
    });

    describe("and update one reference", () => {
        let windforce: {
            input: Item;
            dispatched: {
                item: Item;
                itemType: ItemType;
            };
            output: Item;
        };

        beforeEach(() => {
            windforce = {
                input: {
                    id: 1,
                    assignId: 1,
                    typeId: 0,
                    type: { id: 7, assignId: 7, name: "Hydra Bow" },
                    attributes: [],
                    name: "Windforce",
                    sockets: [],
                    createdAt,
                    updatedAt: null,
                },
                dispatched: {
                    itemType: { id: 7, assignId: 7, name: "Hydra Bow" },
                    item: {
                        id: 1,
                        typeId: 7,
                        attributes: [],
                        name: "Windforce",
                        assignId: 1,
                        createdAt,
                        updatedAt: null,
                    },
                },
                output: {
                    id: 1,
                    assignId: 1,
                    typeId: 7,
                    type: { id: 7, assignId: 7, name: "Hydra Bow" },
                    attributes: [],
                    createdAt,
                    name: "Windforce",
                    sockets: [],
                    updatedAt,
                },
            };
        });

        it("using a save mutator", async () => {
            // arrange
            const saveItems = repository.useRpg().useSaveItems(createdAt, updatedAt);
            const saveItemTypes = repository.useRpg().useSaveItemTypes();

            // act
            const saved = await workspace.in(ItemBlueprint).select({ type: true }).save(windforce.input);

            // assert
            expect(saveItemTypes).toHaveBeenCalledBefore(saveItems);
            expect(saveItemTypes).toHaveBeenCalledWith<Parameters<SaveEntitiesFn<ItemTypeBlueprint>>>({
                entities: [windforce.dispatched.itemType],
                selection: {},
            });
            expect(saveItems).toHaveBeenCalledWith<Parameters<SaveEntitiesFn<ItemBlueprint>>>({
                entities: [windforce.dispatched.item],
                selection: {},
            });
            expect(saved).toEqual(windforce.output);
            expect(saved).toBe(windforce.input);
        });

        it("using an update mutator", async () => {
            // arrange
            const updateItems = repository.useRpg().useUpdateItems(updatedAt);
            const updateItemTypes = repository.useRpg().useUpdateItemTypes();

            // act
            const saved = await workspace.in(ItemBlueprint).select({ type: true }).save(windforce.input);

            // assert
            expect(updateItemTypes).toHaveBeenCalledBefore(updateItems);
            expect(updateItemTypes).toHaveBeenCalledWith<Parameters<UpdateEntitiesFn<ItemTypeBlueprint>>>({
                entities: [windforce.dispatched.itemType],
                selection: {},
            });
            expect(updateItems).toHaveBeenCalledWith<Parameters<UpdateEntitiesFn<ItemBlueprint>>>({
                entities: [windforce.dispatched.item],
                selection: {},
            });
            expect(saved).toEqual(windforce.output);
            expect(saved).toBe(windforce.input);
        });
    });

    describe("and create children", () => {
        let windforce: {
            input: Item;
            dispatched: {
                item: Item;
                itemSockets: ItemSocket[];
            };
            output: Item;
        };

        beforeEach(() => {
            windforce = {
                input: {
                    id: 1,
                    assignId: 1,
                    typeId: 7,
                    attributes: [],
                    name: "Windforce",
                    sockets: [
                        { id: 0, createdAt: "", updatedAt: null, assignId: 10, itemId: 0, socketedItemId: 100 },
                        { id: 0, createdAt: "", updatedAt: null, assignId: 20, itemId: 0, socketedItemId: 200 },
                    ],
                    createdAt,
                    updatedAt: null,
                },
                dispatched: {
                    item: {
                        id: 1,
                        typeId: 7,
                        attributes: [],
                        name: "Windforce",
                        assignId: 1,
                        createdAt,
                        updatedAt: null,
                    },
                    itemSockets: [
                        { id: 0, createdAt: "", updatedAt: null, assignId: 10, itemId: 1, socketedItemId: 100 },
                        { id: 0, createdAt: "", updatedAt: null, assignId: 20, itemId: 1, socketedItemId: 200 },
                    ],
                },
                output: {
                    id: 1,
                    assignId: 1,
                    typeId: 7,
                    attributes: [],
                    createdAt,
                    name: "Windforce",
                    sockets: [
                        { id: 10, assignId: 10, itemId: 1, socketedItemId: 100, createdAt, updatedAt: null },
                        { id: 20, assignId: 20, itemId: 1, socketedItemId: 200, createdAt, updatedAt: null },
                    ],
                    updatedAt,
                },
            };
        });

        it("using a save mutator", async () => {
            // arrange
            const saveItems = repository.useRpg().useSaveItems(createdAt, updatedAt);
            const saveItemSockets = repository.useRpg().useSaveItemSockets(createdAt, updatedAt);

            // act
            const saved = await workspace.in(ItemBlueprint).select({ sockets: true }).save(windforce.input);

            // assert
            expect(saveItems).toHaveBeenCalledBefore(saveItemSockets);
            expect(saveItems).toHaveBeenCalledWith<Parameters<SaveEntitiesFn<ItemBlueprint>>>({
                entities: [windforce.dispatched.item],
                selection: {},
            });
            expect(saveItemSockets).toHaveBeenCalledWith<Parameters<SaveEntitiesFn<ItemSocketBlueprint>>>({
                entities: windforce.dispatched.itemSockets,
                selection: {},
            });
            expect(saved).toEqual(windforce.output);
            expect(saved).toBe(windforce.input);
        });

        it("using an update and a create mutator", async () => {
            // arrange
            const updateItems = repository.useRpg().useUpdateItems(updatedAt);
            const createItemSockets = repository.useRpg().useCreateItemSockets(createdAt);

            // act
            const saved = await workspace.in(ItemBlueprint).select({ sockets: true }).save(windforce.input);

            // assert
            expect(updateItems).toHaveBeenCalledBefore(createItemSockets);
            expect(updateItems).toHaveBeenCalledWith<Parameters<UpdateEntitiesFn<ItemBlueprint>>>({
                entities: [windforce.dispatched.item],
                selection: {},
            });
            expect(createItemSockets).toHaveBeenCalledWith<Parameters<CreateEntitiesFn<ItemSocketBlueprint>>>({
                entities: windforce.dispatched.itemSockets,
                selection: {},
            });
            expect(saved).toEqual(windforce.output);
            expect(saved).toBe(windforce.input);
        });
    });

    describe("and update children", () => {
        let windforce: {
            input: Item;
            dispatched: {
                item: Item;
                itemSockets: ItemSocket[];
            };
            output: Item;
        };

        beforeEach(() => {
            windforce = {
                input: {
                    id: 1,
                    assignId: 1,
                    typeId: 7,
                    attributes: [],
                    name: "Windforce",
                    sockets: [
                        { id: 10, assignId: 10, itemId: 2, socketedItemId: 100, createdAt, updatedAt: null },
                        { id: 20, assignId: 20, itemId: 2, socketedItemId: 200, createdAt, updatedAt: null },
                    ],
                    createdAt,
                    updatedAt: null,
                },
                dispatched: {
                    item: {
                        id: 1,
                        typeId: 7,
                        attributes: [],
                        name: "Windforce",
                        assignId: 1,
                        createdAt,
                        updatedAt: null,
                    },
                    itemSockets: [
                        { id: 10, itemId: 1, socketedItemId: 100, assignId: 10, createdAt, updatedAt: null },
                        { id: 20, itemId: 1, socketedItemId: 200, assignId: 20, createdAt, updatedAt: null },
                    ],
                },
                output: {
                    id: 1,
                    assignId: 1,
                    typeId: 7,
                    attributes: [],
                    createdAt,
                    name: "Windforce",
                    sockets: [
                        { id: 10, assignId: 10, itemId: 1, socketedItemId: 100, createdAt, updatedAt },
                        { id: 20, assignId: 20, itemId: 1, socketedItemId: 200, createdAt, updatedAt },
                    ],
                    updatedAt,
                },
            };
        });

        it("using a save mutator", async () => {
            // arrange
            const saveItems = repository.useRpg().useSaveItems(createdAt, updatedAt);
            const saveItemSockets = repository.useRpg().useSaveItemSockets(createdAt, updatedAt);

            // act
            const saved = await workspace.in(ItemBlueprint).select({ sockets: true }).save(windforce.input);

            // assert
            expect(saveItems).toHaveBeenCalledBefore(saveItemSockets);
            expect(saveItems).toHaveBeenCalledWith<Parameters<SaveEntitiesFn<ItemBlueprint>>>({
                entities: [windforce.dispatched.item],
                selection: {},
            });
            expect(saveItemSockets).toHaveBeenCalledWith<Parameters<SaveEntitiesFn<ItemSocketBlueprint>>>({
                entities: windforce.dispatched.itemSockets,
                selection: {},
            });
            expect(saved).toEqual(windforce.output);
            expect(saved).toBe(windforce.input);
        });

        it("using an update mutator", async () => {
            // arrange
            const createItems = repository.useRpg().useUpdateItems(updatedAt);
            const updateItemSockets = repository.useRpg().useUpdateItemSockets(updatedAt);

            // act
            const saved = await workspace.in(ItemBlueprint).select({ sockets: true }).save(windforce.input);

            // assert
            expect(createItems).toHaveBeenCalledBefore(updateItemSockets);
            expect(createItems).toHaveBeenCalledWith<Parameters<CreateEntitiesFn<ItemBlueprint>>>({
                entities: [windforce.dispatched.item],
                selection: {},
            });
            expect(updateItemSockets).toHaveBeenCalledWith<Parameters<UpdateEntitiesFn<ItemSocketBlueprint>>>({
                entities: windforce.dispatched.itemSockets,
                selection: {},
            });
            expect(saved).toEqual(windforce.output);
            expect(saved).toBe(windforce.input);
        });
    });

    describe("and delete children", () => {
        let windforce: {
            input: Item;
            previous: Item;
            dispatched: {
                item: Item;
                itemSockets: ItemSocket[];
            };
            output: Item;
        };

        beforeEach(() => {
            const socketA: ItemSocket = {
                id: 10,
                assignId: 10,
                itemId: 1,
                socketedItemId: 100,
                createdAt,
                updatedAt: null,
            };

            const socketB: ItemSocket = {
                id: 20,
                assignId: 20,
                itemId: 1,
                socketedItemId: 200,
                createdAt,
                updatedAt: null,
            };

            const socketC: ItemSocket = {
                id: 30,
                assignId: 30,
                itemId: 1,
                socketedItemId: 300,
                createdAt,
                updatedAt: null,
            };

            windforce = {
                input: {
                    id: 1,
                    assignId: 1,
                    typeId: 7,
                    attributes: [],
                    name: "Windforce",
                    sockets: [{ ...socketA }, { ...socketC }],
                    createdAt,
                    updatedAt: null,
                },
                previous: {
                    id: 1,
                    assignId: 1,
                    typeId: 7,
                    attributes: [],
                    name: "Windforce 1.08",
                    sockets: [{ ...socketA }, { ...socketB }, { ...socketC }],
                    createdAt,
                    updatedAt: null,
                },
                dispatched: {
                    item: {
                        id: 1,
                        typeId: 7,
                        attributes: [],
                        name: "Windforce",
                        assignId: 1,
                        createdAt,
                        updatedAt: null,
                    },
                    itemSockets: [{ ...socketB }],
                },
                output: {
                    id: 1,
                    assignId: 1,
                    typeId: 7,
                    attributes: [],
                    createdAt,
                    name: "Windforce",
                    sockets: [socketA, socketC],
                    updatedAt,
                },
            };
        });

        it("using a save mutator", async () => {
            // arrange
            const saveItems = repository.useRpg().useSaveItems(createdAt, updatedAt, true);

            // act
            const saved = await workspace
                .in(ItemBlueprint)
                .select({ sockets: true })
                .save(windforce.input, windforce.previous);

            // assert
            expect(saveItems).toHaveBeenCalledWith<Parameters<SaveEntitiesFn<ItemBlueprint>>>({
                entities: [
                    {
                        ...windforce.dispatched.item,
                        sockets: [
                            { id: 10, assignId: 10, itemId: 1, socketedItemId: 100, createdAt, updatedAt: null },
                            { id: 30, assignId: 30, itemId: 1, socketedItemId: 300, createdAt, updatedAt: null },
                        ],
                    },
                ],
                selection: { sockets: true },
            });
            expect(saved).toEqual({
                ...windforce.output,
                sockets: [
                    { id: 10, assignId: 10, itemId: 1, socketedItemId: 100, createdAt, updatedAt },
                    { id: 30, assignId: 30, itemId: 1, socketedItemId: 300, createdAt, updatedAt },
                ],
            });
            expect(saved).toBe(windforce.input);
        });

        it("using a save mutator and a delete mutator", async () => {
            // arrange
            const saveItems = repository.useRpg().useSaveItems(createdAt, updatedAt);
            const deleteItemSockets = repository.useRpg().useDeleteItemSockets();

            // act
            const saved = await workspace
                .in(ItemBlueprint)
                .select({ sockets: true })
                .save(windforce.input, windforce.previous);

            // assert
            // [todo] ❌ doesn't work yet
            // expect(deleteItemSockets).toHaveBeenCalledBefore(saveItems);
            expect(deleteItemSockets).toHaveBeenCalledWith<Parameters<DeleteEntitiesFn<ItemSocketBlueprint>>>({
                entities: windforce.dispatched.itemSockets,
                selection: {},
            });
            expect(saveItems).toHaveBeenCalledWith<Parameters<SaveEntitiesFn<ItemBlueprint>>>({
                entities: [windforce.dispatched.item],
                selection: {},
            });
            expect(saved).toEqual(windforce.output);
            expect(saved).toBe(windforce.input);
        });

        it("using an update and a delete mutator", async () => {
            // arrange
            const updateItems = repository.useRpg().useUpdateItems(updatedAt);
            const deleteItemSockets = repository.useRpg().useDeleteItemSockets();

            // act
            const saved = await workspace
                .in(ItemBlueprint)
                .select({ sockets: true })
                .save(windforce.input, windforce.previous);

            // assert
            // [todo] ❌ doesn't work yet
            // expect(deleteItemSockets).toHaveBeenCalledBefore(updateItems);
            expect(deleteItemSockets).toHaveBeenCalledWith<Parameters<DeleteEntitiesFn<ItemSocketBlueprint>>>({
                entities: windforce.dispatched.itemSockets,
                selection: {},
            });
            expect(updateItems).toHaveBeenCalledWith<Parameters<UpdateEntitiesFn<ItemBlueprint>>>({
                entities: [windforce.dispatched.item],
                selection: {},
            });
            expect(saved).toEqual(windforce.output);
            expect(saved).toBe(windforce.input);
        });
    });
});

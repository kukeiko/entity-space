import { Item, ItemBlueprint, ItemSavable, ItemSocketSavable, ItemTypeSavable } from "@entity-space/elements/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { EntityWorkspace } from "../../entity-workspace";
import { TestFacade, TestRepository } from "../../testing";

describe("save updates one entity", () => {
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
            input: ItemSavable;
            dispatched: ItemSavable;
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
                },
                dispatched: {
                    id: 1,
                    typeId: 7,
                    attributes: [],
                    name: "Windforce",
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
            const saveItems = repository.useSaveItems(createdAt, updatedAt);

            // act
            const saved = await workspace.in(ItemBlueprint).save(windforce.input);

            // assert
            expect(saveItems).toHaveBeenCalledWith({ entities: [windforce.dispatched], selection: {} });
            expect(saved).toEqual(windforce.output);
            expect(saved).toBe(windforce.input);
        });

        it("using an update mutator", async () => {
            // arrange
            const updateItems = repository.useUpdateItems(updatedAt);

            // act
            const saved = await workspace.in(ItemBlueprint).save(windforce.input);

            // assert
            expect(updateItems).toHaveBeenCalledWith({ entities: [windforce.dispatched], selection: {} });
            expect(saved).toEqual(windforce.output);
            expect(saved).toBe(windforce.input);
        });
    });

    describe("and create one reference", () => {
        let windforce: {
            input: ItemSavable;
            dispatched: {
                item: ItemSavable;
                itemType: ItemTypeSavable;
            };
            output: Item;
        };

        beforeEach(() => {
            windforce = {
                input: {
                    id: 1,
                    assignId: 1,
                    typeId: 0,
                    type: { assignId: 7, name: "Hydra Bow" },
                    attributes: [],
                    name: "Windforce",
                    sockets: [],
                    createdAt,
                },
                dispatched: {
                    itemType: { assignId: 7, name: "Hydra Bow" },
                    item: {
                        id: 1,
                        typeId: 7,
                        attributes: [],
                        name: "Windforce",
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
            const saveItems = repository.useSaveItems(createdAt, updatedAt);
            const saveItemTypes = repository.useSaveItemTypes();

            // act
            const saved = await workspace.in(ItemBlueprint).select({ type: true }).save(windforce.input);

            // assert
            expect(saveItemTypes).toHaveBeenCalledWith({
                entities: [windforce.dispatched.itemType],
                selection: {},
            });
            expect(saveItems).toHaveBeenCalledWith({
                entities: [windforce.dispatched.item],
                selection: {},
            });
            expect(saved).toEqual(windforce.output);
            expect(saved).toBe(windforce.input);
        });

        it("using an update and a create mutator", async () => {
            // arrange
            const updateItems = repository.useUpdateItems(updatedAt);
            const createItemTypes = repository.useCreateItemTypes();

            // act
            const saved = await workspace.in(ItemBlueprint).select({ type: true }).save(windforce.input);

            // assert
            expect(createItemTypes).toHaveBeenCalledWith({
                entities: [windforce.dispatched.itemType],
                selection: {},
            });
            expect(updateItems).toHaveBeenCalledWith({
                entities: [windforce.dispatched.item],
                selection: {},
            });
            expect(saved).toEqual(windforce.output);
            expect(saved).toBe(windforce.input);
        });
    });

    describe("and update one reference", () => {
        let windforce: {
            input: ItemSavable;
            dispatched: {
                item: ItemSavable;
                itemType: ItemTypeSavable;
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
                },
                dispatched: {
                    itemType: { id: 7, name: "Hydra Bow" },
                    item: {
                        id: 1,
                        typeId: 7,
                        attributes: [],
                        name: "Windforce",
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
            const saveItems = repository.useSaveItems(createdAt, updatedAt);
            const saveItemTypes = repository.useSaveItemTypes();

            // act
            const saved = await workspace.in(ItemBlueprint).select({ type: true }).save(windforce.input);

            // assert
            expect(saveItemTypes).toHaveBeenCalledWith({
                entities: [windforce.dispatched.itemType],
                selection: {},
            });
            expect(saveItems).toHaveBeenCalledWith({
                entities: [windforce.dispatched.item],
                selection: {},
            });
            expect(saved).toEqual(windforce.output);
            expect(saved).toBe(windforce.input);
        });

        it("using an update mutator", async () => {
            // arrange
            const updateItems = repository.useUpdateItems(updatedAt);
            const updateItemTypes = repository.useUpdateItemTypes();

            // act
            const saved = await workspace.in(ItemBlueprint).select({ type: true }).save(windforce.input);

            // assert
            expect(updateItemTypes).toHaveBeenCalledWith({
                entities: [windforce.dispatched.itemType],
                selection: {},
            });
            expect(updateItems).toHaveBeenCalledWith({
                entities: [windforce.dispatched.item],
                selection: {},
            });
            expect(saved).toEqual(windforce.output);
            expect(saved).toBe(windforce.input);
        });
    });

    describe("and create children", () => {
        let windforce: {
            input: ItemSavable;
            dispatched: {
                item: ItemSavable;
                itemSockets: ItemSocketSavable[];
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
                        { assignId: 10, itemId: 0, socketedItemId: 100 },
                        { assignId: 20, itemId: 0, socketedItemId: 200 },
                    ],
                    createdAt,
                },
                dispatched: {
                    item: {
                        id: 1,
                        typeId: 7,
                        attributes: [],
                        name: "Windforce",
                    },
                    itemSockets: [
                        { assignId: 10, itemId: 1, socketedItemId: 100 },
                        { assignId: 20, itemId: 1, socketedItemId: 200 },
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
            const saveItems = repository.useSaveItems(createdAt, updatedAt);
            const saveItemSockets = repository.useSaveItemSockets(createdAt, updatedAt);

            // act
            const saved = await workspace.in(ItemBlueprint).select({ sockets: true }).save(windforce.input);

            // assert
            expect(saveItemSockets).toHaveBeenCalledWith({
                entities: windforce.dispatched.itemSockets,
                selection: {},
            });
            expect(saveItems).toHaveBeenCalledWith({ entities: [windforce.dispatched.item], selection: {} });
            expect(saved).toEqual(windforce.output);
            expect(saved).toBe(windforce.input);
        });

        it("using an update and a create mutator", async () => {
            // arrange
            const updateItems = repository.useUpdateItems(updatedAt);
            const createItemSockets = repository.useCreateItemSockets(createdAt);

            // act
            const saved = await workspace.in(ItemBlueprint).select({ sockets: true }).save(windforce.input);

            // assert
            expect(createItemSockets).toHaveBeenCalledWith({
                entities: windforce.dispatched.itemSockets,
                selection: {},
            });
            expect(updateItems).toHaveBeenCalledWith({ entities: [windforce.dispatched.item], selection: {} });
            expect(saved).toEqual(windforce.output);
            expect(saved).toBe(windforce.input);
        });
    });

    describe("and update children", () => {
        let windforce: {
            input: ItemSavable;
            dispatched: {
                item: ItemSavable;
                itemSockets: ItemSocketSavable[];
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
                        { id: 10, assignId: 10, itemId: 2, socketedItemId: 100, createdAt },
                        { id: 20, assignId: 20, itemId: 2, socketedItemId: 200, createdAt },
                    ],
                    createdAt,
                },
                dispatched: {
                    item: {
                        id: 1,
                        typeId: 7,
                        attributes: [],
                        name: "Windforce",
                    },
                    itemSockets: [
                        { id: 10, itemId: 1, socketedItemId: 100 },
                        { id: 20, itemId: 1, socketedItemId: 200 },
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
            const saveItems = repository.useSaveItems(createdAt, updatedAt);
            const saveItemSockets = repository.useSaveItemSockets(createdAt, updatedAt);

            // act
            const saved = await workspace.in(ItemBlueprint).select({ sockets: true }).save(windforce.input);

            // assert
            expect(saveItemSockets).toHaveBeenCalledWith({
                entities: windforce.dispatched.itemSockets,
                selection: {},
            });
            expect(saveItems).toHaveBeenCalledWith({ entities: [windforce.dispatched.item], selection: {} });
            expect(saved).toEqual(windforce.output);
            expect(saved).toBe(windforce.input);
        });

        it("using an update mutator", async () => {
            // arrange
            const createItems = repository.useUpdateItems(updatedAt);
            const updateItemSockets = repository.useUpdateItemSockets(updatedAt);

            // act
            const saved = await workspace.in(ItemBlueprint).select({ sockets: true }).save(windforce.input);

            // assert
            expect(updateItemSockets).toHaveBeenCalledWith({
                entities: windforce.dispatched.itemSockets,
                selection: {},
            });
            expect(createItems).toHaveBeenCalledWith({ entities: [windforce.dispatched.item], selection: {} });
            expect(saved).toEqual(windforce.output);
            expect(saved).toBe(windforce.input);
        });
    });

    describe("and delete children", () => {
        let windforce: {
            input: ItemSavable;
            previous: Item;
            dispatched: {
                item: ItemSavable;
                itemSockets: ItemSocketSavable[];
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
                        { id: 10, assignId: 10, itemId: 1, socketedItemId: 100, createdAt, updatedAt: null },
                        { id: 30, assignId: 30, itemId: 1, socketedItemId: 300, createdAt, updatedAt: null },
                    ],
                    createdAt,
                },
                previous: {
                    id: 1,
                    assignId: 1,
                    typeId: 7,
                    attributes: [],
                    name: "Windforce 1.08",
                    sockets: [
                        { id: 10, assignId: 10, itemId: 1, socketedItemId: 100, createdAt, updatedAt: null },
                        { id: 20, assignId: 20, itemId: 1, socketedItemId: 200, createdAt, updatedAt: null },
                        { id: 30, assignId: 30, itemId: 1, socketedItemId: 300, createdAt, updatedAt: null },
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
                    },
                    itemSockets: [{ id: 20, assignId: 20, itemId: 1, socketedItemId: 200, createdAt, updatedAt: null }],
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
                        { id: 30, assignId: 30, itemId: 1, socketedItemId: 300, createdAt, updatedAt: null },
                    ],
                    updatedAt,
                },
            };
        });

        it("using a save mutator", async () => {
            // arrange
            const saveItems = repository.useSaveItems(createdAt, updatedAt, true);

            // act
            const saved = await workspace
                .in(ItemBlueprint)
                .select({ sockets: true })
                .save(windforce.input, windforce.previous);

            // assert
            expect(saveItems).toHaveBeenCalledWith({
                entities: [
                    {
                        ...windforce.dispatched.item,
                        sockets: [
                            { id: 10, itemId: 1, socketedItemId: 100 },
                            { id: 30, itemId: 1, socketedItemId: 300 },
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
            const saveItems = repository.useSaveItems(createdAt, updatedAt);
            const deleteItemSockets = repository.useDeleteItemSockets();

            // act
            const saved = await workspace
                .in(ItemBlueprint)
                .select({ sockets: true })
                .save(windforce.input, windforce.previous);

            // assert
            expect(deleteItemSockets).toHaveBeenCalledWith({
                entities: windforce.dispatched.itemSockets,
                selection: {},
            });
            expect(saveItems).toHaveBeenCalledWith({ entities: [windforce.dispatched.item], selection: {} });
            expect(saved).toEqual(windforce.output);
            expect(saved).toBe(windforce.input);
        });

        it("using an update and a delete mutator", async () => {
            // arrange
            const saveItems = repository.useUpdateItems(updatedAt);
            const deleteItemSockets = repository.useDeleteItemSockets();

            // act
            const saved = await workspace
                .in(ItemBlueprint)
                .select({ sockets: true })
                .save(windforce.input, windforce.previous);

            // assert
            expect(deleteItemSockets).toHaveBeenCalledWith({
                entities: windforce.dispatched.itemSockets,
                selection: {},
            });
            expect(saveItems).toHaveBeenCalledWith({ entities: [windforce.dispatched.item], selection: {} });
            expect(saved).toEqual(windforce.output);
            expect(saved).toBe(windforce.input);
        });
    });
});

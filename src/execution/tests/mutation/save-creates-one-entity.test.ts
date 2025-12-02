import { Item, ItemBlueprint, ItemSavable, ItemSocketSavable, ItemTypeSavable } from "@entity-space/elements/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { EntityWorkspace } from "../../entity-workspace";
import { TestFacade, TestRepository } from "../../testing";

describe("save creates one entity", () => {
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
                    assignId: 1,
                    typeId: 7,
                    attributes: [],
                    name: "Windforce",
                    sockets: [],
                },
                dispatched: {
                    assignId: 1,
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
                    updatedAt: null,
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

        it("using a create mutator", async () => {
            // arrange
            const createItems = repository.useCreateItems(createdAt);

            // act
            const saved = await workspace.in(ItemBlueprint).save(windforce.input);

            // assert
            expect(createItems).toHaveBeenCalledWith({ entities: [windforce.dispatched], selection: {} });
            expect(saved).toEqual(windforce.output);
            expect(saved).toBe(windforce.input);
        });
    });

    describe("with one embedded relation", () => {
        let windforce: {
            input: ItemSavable;
            dispatched: ItemSavable;
            output: Item;
        };

        beforeEach(() => {
            windforce = {
                input: {
                    assignId: 1,
                    typeId: 7,
                    attributes: [{ typeId: 100, values: [1, 2, 3] }],
                    name: "Windforce",
                    sockets: [],
                },
                dispatched: {
                    assignId: 1,
                    typeId: 7,
                    attributes: [{ typeId: 100, values: [1, 2, 3] }],
                    name: "Windforce",
                },
                output: {
                    id: 1,
                    assignId: 1,
                    typeId: 7,
                    attributes: [{ typeId: 100, values: [1, 2, 3] }],
                    createdAt,
                    name: "Windforce",
                    sockets: [],
                    updatedAt: null,
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

        it("using a create mutator", async () => {
            // arrange
            const createItems = repository.useCreateItems(createdAt);

            // act
            const saved = await workspace.in(ItemBlueprint).save(windforce.input);

            // assert
            expect(createItems).toHaveBeenCalledWith({ entities: [windforce.dispatched], selection: {} });
            expect(saved).toEqual(windforce.output);
            expect(saved).toBe(windforce.input);
        });
    });

    describe("and create one reference", () => {
        let windforce: {
            input: ItemSavable;
            dispatched: { item: ItemSavable; itemType: ItemTypeSavable };
            output: Item;
        };

        beforeEach(() => {
            windforce = {
                input: {
                    assignId: 1,
                    typeId: 0,
                    type: {
                        assignId: 2,
                        name: "Hydra Bow",
                    },
                    attributes: [],
                    name: "Windforce",
                    sockets: [],
                },
                dispatched: {
                    itemType: { assignId: 2, name: "Hydra Bow" },
                    item: { assignId: 1, typeId: 2, attributes: [], name: "Windforce" },
                },
                output: {
                    id: 1,
                    assignId: 1,
                    typeId: 2,
                    type: {
                        id: 2,
                        assignId: 2,
                        name: "Hydra Bow",
                    },
                    attributes: [],
                    createdAt,
                    name: "Windforce",
                    sockets: [],
                    updatedAt: null,
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
            expect(saveItems).toHaveBeenCalledWith({ entities: [windforce.dispatched.item], selection: {} });
            expect(saved).toEqual(windforce.output);
            expect(saved).toBe(windforce.input);
        });

        it("using a create mutator", async () => {
            // arrange
            const createItems = repository.useCreateItems(createdAt);
            const createItemTypes = repository.useCreateItemTypes();

            // act
            const saved = await workspace.in(ItemBlueprint).select({ type: true }).save(windforce.input);

            // assert
            expect(createItemTypes).toHaveBeenCalledWith({
                entities: [windforce.dispatched.itemType],
                selection: {},
            });
            expect(createItems).toHaveBeenCalledWith({ entities: [windforce.dispatched.item], selection: {} });
            expect(saved).toEqual(windforce.output);
            expect(saved).toBe(windforce.input);
        });
    });

    describe("and update one reference", () => {
        let windforce: {
            input: ItemSavable;
            dispatched: { item: ItemSavable; itemType: ItemTypeSavable };
            output: Item;
        };

        beforeEach(() => {
            windforce = {
                input: {
                    assignId: 1,
                    typeId: 2,
                    type: { id: 2, assignId: 2, name: "Hydra Bow" },
                    attributes: [],
                    name: "Windforce",
                    sockets: [],
                },
                dispatched: {
                    itemType: { id: 2, name: "Hydra Bow" },
                    item: { assignId: 1, typeId: 2, attributes: [], name: "Windforce" },
                },
                output: {
                    id: 1,
                    assignId: 1,
                    typeId: 2,
                    type: { id: 2, assignId: 2, name: "Hydra Bow" },
                    attributes: [],
                    createdAt,
                    name: "Windforce",
                    sockets: [],
                    updatedAt: null,
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

        it("using a create and an update mutator", async () => {
            // arrange
            const createItems = repository.useCreateItems(createdAt);
            const updateItemTypes = repository.useUpdateItemTypes();

            // act
            const saved = await workspace.in(ItemBlueprint).select({ type: true }).save(windforce.input);

            // assert
            expect(updateItemTypes).toHaveBeenCalledWith({
                entities: [windforce.dispatched.itemType],
                selection: {},
            });
            expect(createItems).toHaveBeenCalledWith({
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
            dispatched: { item: ItemSavable; itemSockets: ItemSocketSavable[] };
            output: Item;
        };

        beforeEach(() => {
            windforce = {
                input: {
                    assignId: 1,
                    typeId: 2,
                    attributes: [],
                    name: "Windforce",
                    sockets: [
                        { assignId: 10, itemId: 0, socketedItemId: 100 },
                        { assignId: 20, itemId: 0, socketedItemId: 200 },
                    ],
                },
                dispatched: {
                    item: { assignId: 1, typeId: 2, attributes: [], name: "Windforce" },
                    itemSockets: [
                        { assignId: 10, itemId: 1, socketedItemId: 100 },
                        { assignId: 20, itemId: 1, socketedItemId: 200 },
                    ],
                },
                output: {
                    id: 1,
                    assignId: 1,
                    typeId: 2,
                    attributes: [],
                    createdAt,
                    name: "Windforce",
                    sockets: [
                        { id: 10, assignId: 10, itemId: 1, socketedItemId: 100, createdAt, updatedAt: null },
                        { id: 20, assignId: 20, itemId: 1, socketedItemId: 200, createdAt, updatedAt: null },
                    ],
                    updatedAt: null,
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

        it("using a create mutator", async () => {
            // arrange
            const createItems = repository.useCreateItems(createdAt);
            const createItemSockets = repository.useCreateItemSockets(createdAt);

            // act
            const saved = await workspace.in(ItemBlueprint).select({ sockets: true }).save(windforce.input);

            // assert
            expect(createItemSockets).toHaveBeenCalledWith({
                entities: windforce.dispatched.itemSockets,
                selection: {},
            });
            expect(createItems).toHaveBeenCalledWith({ entities: [windforce.dispatched.item], selection: {} });
            expect(saved).toEqual(windforce.output);
            expect(saved).toBe(windforce.input);
        });
    });

    describe("and update children", () => {
        let windforce: {
            input: ItemSavable;
            dispatched: { item: ItemSavable; itemSockets: ItemSocketSavable[] };
            output: Item;
        };

        beforeEach(() => {
            windforce = {
                input: {
                    assignId: 1,
                    typeId: 2,
                    attributes: [],
                    name: "Windforce",
                    sockets: [
                        {
                            id: 10,
                            assignId: 10,
                            itemId: 2,
                            socketedItemId: 100,
                            createdAt,
                        },
                        {
                            id: 20,
                            assignId: 20,
                            itemId: 2,
                            socketedItemId: 200,
                            createdAt,
                        },
                    ],
                },
                dispatched: {
                    itemSockets: [
                        { id: 10, itemId: 1, socketedItemId: 100 },
                        { id: 20, itemId: 1, socketedItemId: 200 },
                    ],
                    item: { assignId: 1, typeId: 2, attributes: [], name: "Windforce" },
                },
                output: {
                    id: 1,
                    assignId: 1,
                    typeId: 2,
                    attributes: [],
                    createdAt,
                    name: "Windforce",
                    sockets: [
                        { id: 10, assignId: 10, itemId: 1, socketedItemId: 100, createdAt, updatedAt },
                        { id: 20, assignId: 20, itemId: 1, socketedItemId: 200, createdAt, updatedAt },
                    ],
                    updatedAt: null,
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

        it("using a save mutator and empty previous argument", async () => {
            // arrange
            const saveItems = repository.useSaveItems(createdAt, updatedAt);
            const saveItemSockets = repository.useSaveItemSockets(createdAt, updatedAt);

            // act
            const saved = (await workspace.in(ItemBlueprint).select({ sockets: true }).save([windforce.input], []))[0];

            // assert
            expect(saveItemSockets).toHaveBeenCalledWith({
                entities: windforce.dispatched.itemSockets,
                selection: {},
            });
            expect(saveItems).toHaveBeenCalledWith({ entities: [windforce.dispatched.item], selection: {} });
            expect(saved).toEqual(windforce.output);
            expect(saved).toBe(windforce.input);
        });

        it("using a create and an update mutator", async () => {
            // arrange
            const createItems = repository.useCreateItems(createdAt);
            const saveItemSockets = repository.useUpdateItemSockets(updatedAt);

            // act
            const saved = await workspace.in(ItemBlueprint).select({ sockets: true }).save(windforce.input);

            // assert
            expect(saveItemSockets).toHaveBeenCalledWith({
                entities: windforce.dispatched.itemSockets,
                selection: {},
            });
            expect(createItems).toHaveBeenCalledWith({ entities: [windforce.dispatched.item], selection: {} });
            expect(saved).toEqual(windforce.output);
            expect(saved).toBe(windforce.input);
        });
    });
});

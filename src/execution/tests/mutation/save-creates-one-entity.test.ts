import { Item, ItemBlueprint, ItemSocket, ItemType } from "@entity-space/elements/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { EntityWorkspace } from "../../entity-workspace";
import { TestFacade, TestRepository } from "../../testing";

describe("save() creates one entity", () => {
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
            const input: Item = {
                ...workspace.from(ItemBlueprint).constructDefault(),
                assignId: 1,
                typeId: 7,
                name: "Windforce",
                sockets: [],
            };

            windforce = {
                input,
                dispatched: {
                    ...input,
                    sockets: undefined,
                },
                output: {
                    ...input,
                    id: 1,
                    createdAt,
                    updatedAt: null,
                    sockets: [],
                },
            };
        });

        it("using a save mutator", async () => {
            // arrange
            const saveItems = repository.useRpg().useSaveItems(createdAt, updatedAt);

            // act
            const saved = await workspace.in(ItemBlueprint).save(windforce.input);

            // assert
            expect(saveItems).toHaveBeenCalledWith({ entities: [windforce.dispatched], selection: {} });
            expect(saved).toEqual(windforce.output);
            expect(saved).toBe(windforce.input);
        });

        it("using a create mutator", async () => {
            // arrange
            const createItems = repository.useRpg().useCreateItems(createdAt);

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
            input: Item;
            dispatched: Item;
            output: Item;
        };

        beforeEach(() => {
            const input: Item = {
                ...workspace.from(ItemBlueprint).constructDefault(),
                assignId: 1,
                typeId: 7,
                name: "Windforce",
                attributes: [{ typeId: 100, values: [1, 2, 3] }],
            };

            windforce = {
                input,
                dispatched: {
                    ...input,
                },
                output: {
                    ...input,
                    id: 1,
                    createdAt,
                    name: "Windforce",
                },
            };
        });

        it("using a save mutator", async () => {
            // arrange
            const saveItems = repository.useRpg().useSaveItems(createdAt, updatedAt);

            // act
            const saved = await workspace.in(ItemBlueprint).save(windforce.input);

            // assert
            expect(saveItems).toHaveBeenCalledWith({ entities: [windforce.dispatched], selection: {} });
            expect(saved).toEqual(windforce.output);
            expect(saved).toBe(windforce.input);
        });

        it("using a create mutator", async () => {
            // arrange
            const createItems = repository.useRpg().useCreateItems(createdAt);

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
            input: Item;
            dispatched: { item: Item; itemType: ItemType };
            output: Item;
        };

        beforeEach(() => {
            const input: Item = {
                ...workspace.from(ItemBlueprint).constructDefault(),
                assignId: 1,
                name: "Windforce",
                type: {
                    id: 0,
                    assignId: 2,
                    name: "Hydra Bow",
                },
                sockets: [],
            };

            windforce = {
                input,
                dispatched: {
                    itemType: { ...input.type! },
                    item: {
                        ...input,
                        type: undefined,
                        sockets: undefined,
                        typeId: 2,
                    },
                },
                output: {
                    ...input,
                    id: 1,
                    createdAt,
                    typeId: 2,
                    type: {
                        ...input.type!,
                        id: 2,
                    },
                },
            };
        });

        it("using save mutators", async () => {
            // arrange
            const saveItems = repository.useRpg().useSaveItems(createdAt, updatedAt);
            const saveItemTypes = repository.useRpg().useSaveItemTypes();

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

        it("using create mutators", async () => {
            // arrange
            const createItems = repository.useRpg().useCreateItems(createdAt);
            const createItemTypes = repository.useRpg().useCreateItemTypes();

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
            input: Item;
            dispatched: { item: Item; itemType: ItemType };
            output: Item;
        };

        beforeEach(() => {
            const input: Item = {
                ...workspace.from(ItemBlueprint).constructDefault(),
                assignId: 1,
                name: "Windforce",
                typeId: 2,
                type: { id: 2, assignId: 2, name: "Hydra Bow" },
                sockets: [],
            };

            windforce = {
                input,
                dispatched: {
                    itemType: { ...input.type! },
                    item: {
                        ...input,
                        sockets: undefined,
                        type: undefined,
                    },
                },
                output: {
                    ...input,
                    id: 1,
                    createdAt,
                },
            };
        });

        it("using save mutators", async () => {
            // arrange
            const saveItems = repository.useRpg().useSaveItems(createdAt, updatedAt);
            const saveItemTypes = repository.useRpg().useSaveItemTypes();

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
            const createItems = repository.useRpg().useCreateItems(createdAt);
            const updateItemTypes = repository.useRpg().useUpdateItemTypes();

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
            input: Item;
            dispatched: { item: Item; itemSockets: ItemSocket[] };
            output: Item;
        };

        beforeEach(() => {
            const input: Item = {
                ...workspace.from(ItemBlueprint).constructDefault(),
                assignId: 1,
                name: "Windforce",
                typeId: 2,
                sockets: [
                    { id: 0, createdAt: "", updatedAt: null, assignId: 10, itemId: 0, socketedItemId: 100 },
                    { id: 0, createdAt: "", updatedAt: null, assignId: 20, itemId: 0, socketedItemId: 200 },
                ],
            };

            windforce = {
                input,
                dispatched: {
                    item: { ...input, sockets: undefined },
                    itemSockets: [
                        { id: 0, createdAt: "", updatedAt: null, assignId: 10, itemId: 1, socketedItemId: 100 },
                        { id: 0, createdAt: "", updatedAt: null, assignId: 20, itemId: 1, socketedItemId: 200 },
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

        it("using save mutators", async () => {
            // arrange
            const saveItems = repository.useRpg().useSaveItems(createdAt, updatedAt);
            const saveItemSockets = repository.useRpg().useSaveItemSockets(createdAt, updatedAt);

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

        it("using create mutators", async () => {
            // arrange
            const createItems = repository.useRpg().useCreateItems(createdAt);
            const createItemSockets = repository.useRpg().useCreateItemSockets(createdAt);

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
            input: Item;
            dispatched: { item: Item; itemSockets: ItemSocket[] };
            output: Item;
        };

        beforeEach(() => {
            windforce = {
                input: {
                    id: 0,
                    createdAt: "",
                    updatedAt: "",
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
                            updatedAt: null,
                        },
                        {
                            id: 20,
                            assignId: 20,
                            itemId: 2,
                            socketedItemId: 200,
                            createdAt,
                            updatedAt: null,
                        },
                    ],
                },
                dispatched: {
                    itemSockets: [
                        { id: 10, itemId: 1, socketedItemId: 100, createdAt, assignId: 10, updatedAt: null },
                        { id: 20, itemId: 1, socketedItemId: 200, createdAt, assignId: 20, updatedAt: null },
                    ],
                    item: {
                        id: 0,
                        createdAt: "",
                        updatedAt: "",
                        assignId: 1,
                        typeId: 2,
                        attributes: [],
                        name: "Windforce",
                    },
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

        it("using save mutators", async () => {
            // arrange
            const saveItems = repository.useRpg().useSaveItems(createdAt, updatedAt);
            const saveItemSockets = repository.useRpg().useSaveItemSockets(createdAt, updatedAt);

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

        it("using save mutators and empty previous argument", async () => {
            // arrange
            const saveItems = repository.useRpg().useSaveItems(createdAt, updatedAt);
            const saveItemSockets = repository.useRpg().useSaveItemSockets(createdAt, updatedAt);

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
            const createItems = repository.useRpg().useCreateItems(createdAt);
            const saveItemSockets = repository.useRpg().useUpdateItemSockets(updatedAt);

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

    it("save one entity incl. related", async () => {
        // arrange
        const windforce: Item = {
            createdAt: "",
            id: 0,
            updatedAt: null,
            assignId: 1,
            typeId: 7,
            attributes: [
                {
                    typeId: 100,
                    values: [1, 2, 3],
                },
            ],
            name: "Windforce",
            sockets: [
                {
                    assignId: 10,
                    itemId: 0,
                    socketedItemId: 2,
                    createdAt: "",
                    id: 0,
                    updatedAt: null,
                },
            ],
        };

        const windforcePassedToSave: Item = {
            createdAt: "",
            id: 0,
            updatedAt: null,
            assignId: 1,
            typeId: 7,
            attributes: [
                {
                    typeId: 100,
                    values: [1, 2, 3],
                },
            ],
            name: "Windforce",
            sockets: [
                {
                    assignId: 10,
                    itemId: 0,
                    socketedItemId: 2,
                    createdAt: "",
                    id: 0,
                    updatedAt: null,
                },
            ],
        };

        const windforceSaved: Item = {
            id: 1,
            typeId: 7,
            assignId: 1,
            attributes: [
                {
                    typeId: 100,
                    values: [1, 2, 3],
                },
            ],
            createdAt,
            name: "Windforce",
            updatedAt,
            sockets: [
                {
                    id: 10,
                    assignId: 10,
                    itemId: 1,
                    socketedItemId: 2,
                    createdAt,
                    updatedAt: null,
                },
            ],
        };

        const saveItem = repository.useRpg().useSaveItems_deprecated(createdAt, updatedAt);

        // act
        const saved = await workspace.in(ItemBlueprint).select({ sockets: true }).save([windforce]);

        // assert
        expect(saveItem).toHaveBeenCalledWith({ entities: [windforcePassedToSave], selection: { sockets: true } });
        expect(saved).toEqual([windforceSaved]);
        expect(saved[0]).toBe(windforce);
    });
});

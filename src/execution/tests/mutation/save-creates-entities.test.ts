import {
    Item,
    ItemAttribute,
    ItemAttributeBlueprint,
    ItemBlueprint,
    ItemSocket,
    ItemSocketBlueprint,
    ItemType,
    ItemTypeBlueprint,
} from "@entity-space/elements/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { EntityWorkspace } from "../../entity-workspace";
import { CreateEntitiesFn, SaveEntitiesFn, UpdateEntitiesFn } from "../../mutation/entity-mutation-function.type";
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
                ...facade.constructDefault(ItemBlueprint),
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
            expect(saveItems).toHaveBeenCalledWith<Parameters<SaveEntitiesFn<ItemBlueprint>>>({
                entities: [windforce.dispatched],
                selection: {},
            });
            expect(saved).toEqual(windforce.output);
            expect(saved).toBe(windforce.input);
        });

        it("using a create mutator", async () => {
            // arrange
            const createItems = repository.useRpg().useCreateItems(createdAt);

            // act
            const saved = await workspace.in(ItemBlueprint).save(windforce.input);

            // assert
            expect(createItems).toHaveBeenCalledWith<Parameters<CreateEntitiesFn<ItemBlueprint>>>({
                entities: [windforce.dispatched],
                selection: {},
            });
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
            expect(saveItems).toHaveBeenCalledWith<Parameters<SaveEntitiesFn<ItemBlueprint>>>({
                entities: [windforce.dispatched],
                selection: {},
            });
            expect(saved).toEqual(windforce.output);
            expect(saved).toBe(windforce.input);
        });

        it("using a create mutator", async () => {
            // arrange
            const createItems = repository.useRpg().useCreateItems(createdAt);

            // act
            const saved = await workspace.in(ItemBlueprint).save(windforce.input);

            // assert
            expect(createItems).toHaveBeenCalledWith<Parameters<CreateEntitiesFn<ItemBlueprint>>>({
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
            dispatched: { item: Item; itemType: ItemType };
            output: Item;
        };

        beforeEach(() => {
            const type: ItemType = {
                ...facade.constructDefault(ItemTypeBlueprint),
                assignId: 2,
                name: "Hydra Bow",
            };

            const input: Item = {
                ...facade.constructDefault(ItemBlueprint),
                assignId: 1,
                name: "Windforce",
                type,
                sockets: [],
            };

            windforce = {
                input,
                dispatched: {
                    itemType: { ...type },
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
                    type: { ...type, id: 2 },
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

        it("using create mutators", async () => {
            // arrange
            const createItems = repository.useRpg().useCreateItems(createdAt);
            const createItemTypes = repository.useRpg().useCreateItemTypes();

            // act
            const saved = await workspace.in(ItemBlueprint).select({ type: true }).save(windforce.input);

            // assert
            expect(createItemTypes).toHaveBeenCalledBefore(createItems);
            expect(createItemTypes).toHaveBeenCalledWith<Parameters<CreateEntitiesFn<ItemTypeBlueprint>>>({
                entities: [windforce.dispatched.itemType],
                selection: {},
            });
            expect(createItems).toHaveBeenCalledWith<Parameters<CreateEntitiesFn<ItemBlueprint>>>({
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
            dispatched: { item: Item; itemType: ItemType };
            output: Item;
        };

        beforeEach(() => {
            const type: ItemType = {
                ...facade.constructDefault(ItemTypeBlueprint),
                id: 2,
                assignId: 2,
                name: "Hydra Bow",
            };

            const input: Item = {
                ...facade.constructDefault(ItemBlueprint),
                assignId: 1,
                name: "Windforce",
                typeId: 2,
                type,
                sockets: [],
            };

            windforce = {
                input,
                dispatched: {
                    itemType: { ...type },
                    item: {
                        ...input,
                        sockets: undefined,
                        type: undefined,
                    },
                },
                output: {
                    ...input,
                    type: { ...type },
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

        it("using a create and an update mutator", async () => {
            // arrange
            const createItems = repository.useRpg().useCreateItems(createdAt);
            const updateItemTypes = repository.useRpg().useUpdateItemTypes();

            // act
            const saved = await workspace.in(ItemBlueprint).select({ type: true }).save(windforce.input);

            // assert
            expect(updateItemTypes).toHaveBeenCalledBefore(createItems);
            expect(updateItemTypes).toHaveBeenCalledWith<Parameters<UpdateEntitiesFn<ItemTypeBlueprint>>>({
                entities: [windforce.dispatched.itemType],
                selection: {},
            });
            expect(createItems).toHaveBeenCalledWith<Parameters<CreateEntitiesFn<ItemBlueprint>>>({
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
            const socketA: ItemSocket = {
                ...facade.constructDefault(ItemSocketBlueprint),
                assignId: 10,
                socketedItemId: 100,
            };

            const socketB: ItemSocket = {
                ...facade.constructDefault(ItemSocketBlueprint),
                assignId: 20,
                socketedItemId: 200,
            };

            const input: Item = {
                ...facade.constructDefault(ItemBlueprint),
                assignId: 1,
                name: "Windforce",
                typeId: 2,
                sockets: [socketA, socketB],
            };

            windforce = {
                input,
                dispatched: {
                    item: { ...input, sockets: undefined },
                    itemSockets: [
                        { ...socketA, itemId: 1 },
                        { ...socketB, itemId: 1 },
                    ],
                },
                output: {
                    ...input,
                    id: 1,
                    attributes: [],
                    createdAt,
                    updatedAt: null,
                    sockets: [
                        { ...socketA, itemId: 1, id: 10, createdAt },
                        { ...socketB, itemId: 1, id: 20, createdAt },
                    ],
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

        it("using create mutators", async () => {
            // arrange
            const createItems = repository.useRpg().useCreateItems(createdAt);
            const createItemSockets = repository.useRpg().useCreateItemSockets(createdAt);

            // act
            const saved = await workspace.in(ItemBlueprint).select({ sockets: true }).save(windforce.input);

            // assert
            expect(createItems).toHaveBeenCalledBefore(createItemSockets);
            expect(createItems).toHaveBeenCalledWith<Parameters<CreateEntitiesFn<ItemBlueprint>>>({
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
            dispatched: { item: Item; itemSockets: ItemSocket[] };
            output: Item;
        };

        beforeEach(() => {
            const socketA: ItemSocket = {
                ...facade.constructDefault(ItemSocketBlueprint),
                id: 10,
                itemId: 1,
                socketedItemId: 100,
                createdAt,
            };

            const socketB: ItemSocket = {
                ...facade.constructDefault(ItemSocketBlueprint),
                id: 20,
                itemId: 1,
                socketedItemId: 200,
                createdAt,
            };

            const input: Item = {
                ...facade.constructDefault(ItemBlueprint),
                assignId: 1,
                typeId: 2,
                name: "Windforce",
                sockets: [socketA, socketB],
            };

            windforce = {
                input,
                dispatched: {
                    itemSockets: [{ ...socketA }, { ...socketB }],
                    item: { ...input, sockets: undefined },
                },
                output: {
                    ...input,
                    id: 1,
                    createdAt,
                    updatedAt: null,
                    sockets: [
                        { ...socketA, updatedAt },
                        { ...socketB, updatedAt },
                    ],
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

        it("using save mutators and empty previous argument", async () => {
            // arrange
            const saveItems = repository.useRpg().useSaveItems(createdAt, updatedAt);
            const saveItemSockets = repository.useRpg().useSaveItemSockets(createdAt, updatedAt);

            // act
            const saved = (await workspace.in(ItemBlueprint).select({ sockets: true }).save([windforce.input], []))[0];

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

        it("using a create and an update mutator", async () => {
            // arrange
            const createItems = repository.useRpg().useCreateItems(createdAt);
            const saveItemSockets = repository.useRpg().useUpdateItemSockets(updatedAt);

            // act
            const saved = await workspace.in(ItemBlueprint).select({ sockets: true }).save(windforce.input);

            // assert
            expect(createItems).toHaveBeenCalledBefore(saveItemSockets);
            expect(createItems).toHaveBeenCalledWith<Parameters<CreateEntitiesFn<ItemBlueprint>>>({
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
    });

    // [todo] 🧪 i thought this test was redundant, but when trying to move mutation dependencies to entity-changes,
    // this was the only test that reported an issue, as "sortAcceptedMutationsByDependency" erroneously allowed
    // a mutation to be a dependency of itself.
    it("save one entity incl. related", async () => {
        // arrange
        const socket: ItemSocket = {
            ...facade.constructDefault(ItemSocketBlueprint),
            assignId: 10,
            socketedItemId: 2,
        };

        const attribute: ItemAttribute = {
            ...facade.constructDefault(ItemAttributeBlueprint),
            typeId: 100,
            values: [1, 2, 3],
        };

        const windforce: Item = {
            ...facade.constructDefault(ItemBlueprint),
            assignId: 1,
            typeId: 7,
            name: "Windforce",
            attributes: [attribute],
            sockets: [socket],
        };

        const windforcePassedToSave = structuredClone(windforce);

        const windforceSaved: Item = {
            ...windforce,
            id: 1,
            attributes: [{ ...attribute }],
            createdAt,
            sockets: [{ ...socket, id: 10, itemId: 1, createdAt }],
        };

        const saveItem = repository.useRpg().useSaveItems(createdAt, updatedAt, true);

        // act
        const saved = await workspace.in(ItemBlueprint).select({ sockets: true }).save([windforce]);

        // assert
        expect(saveItem).toHaveBeenCalledWith<Parameters<SaveEntitiesFn<ItemBlueprint>>>({
            entities: [windforcePassedToSave],
            selection: { sockets: true },
        });
        expect(saved).toEqual([windforceSaved]);
        expect(saved[0]).toBe(windforce);
    });
});

describe("save() creates many entities", () => {
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
            input: Item[];
            dispatched: Item[];
            output: Item[];
        };

        beforeEach(() => {
            const itemA: Item = {
                ...facade.constructDefault(ItemBlueprint),
                assignId: 1,
                typeId: 7,
                name: "Windforce",
                sockets: [],
            };

            const itemB: Item = {
                ...facade.constructDefault(ItemBlueprint),
                assignId: 2,
                typeId: 3,
                name: "Shako",
                sockets: [],
            };

            windforce = {
                input: [{ ...itemA }, { ...itemB }],
                dispatched: [
                    { ...itemA, sockets: undefined },
                    { ...itemB, sockets: undefined },
                ],
                output: [
                    { ...itemA, id: 1, createdAt },
                    { ...itemB, id: 2, createdAt },
                ],
            };
        });

        it("using a save mutator", async () => {
            // arrange
            const saveItems = repository.useRpg().useSaveItems(createdAt, updatedAt);

            // act
            const saved = await workspace.in(ItemBlueprint).save(windforce.input);

            // assert
            expect(saveItems).toHaveBeenCalledWith<Parameters<SaveEntitiesFn<ItemBlueprint>>>({
                entities: windforce.dispatched,
                selection: {},
            });
            expect(saved).toEqual(windforce.output);
            expect(saved).toBe(windforce.input);
        });

        it("using a create mutator", async () => {
            // arrange
            const createItems = repository.useRpg().useCreateItems(createdAt);

            // act
            const saved = await workspace.in(ItemBlueprint).save(windforce.input);

            // assert
            expect(createItems).toHaveBeenCalledWith<Parameters<CreateEntitiesFn<ItemBlueprint>>>({
                entities: windforce.dispatched,
                selection: {},
            });
            expect(saved).toEqual(windforce.output);
            expect(saved).toBe(windforce.input);
        });
    });
});

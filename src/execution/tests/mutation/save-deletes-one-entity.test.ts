import { Item, ItemBlueprint, ItemSocket, ItemSocketBlueprint } from "@entity-space/elements/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { EntityWorkspace } from "../../entity-workspace";
import { DeleteEntitiesFn } from "../../mutation/entity-mutation-function.type";
import { TestFacade, TestRepository } from "../../testing";

describe("save() deletes one entity", () => {
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
            output: [];
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
                    updatedAt,
                },
                dispatched: {
                    id: 1,
                    assignId: 1,
                    typeId: 7,
                    attributes: [],
                    name: "Windforce",
                    createdAt,
                    updatedAt,
                },
                output: [],
            };
        });

        it("using a delete mutator", async () => {
            // arrange
            const deleteItems = repository.useRpg().useDeleteItems();

            // act
            const saved = await workspace.in(ItemBlueprint).save([], [windforce.input]);

            // assert
            expect(deleteItems).toHaveBeenCalledWith<Parameters<DeleteEntitiesFn<ItemBlueprint>>>({
                entities: [windforce.dispatched],
                selection: {},
            });
            expect(saved).toEqual(windforce.output);
        });
    });

    describe("and delete children", () => {
        let windforce: {
            input: Item;
            dispatched: {
                item: Item;
                itemSockets: ItemSocket[];
            };
            output: [];
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
                        { id: 20, assignId: 20, itemId: 1, socketedItemId: 200, createdAt, updatedAt: null },
                        { id: 30, assignId: 30, itemId: 1, socketedItemId: 300, createdAt, updatedAt: null },
                    ],
                    createdAt,
                    updatedAt,
                },
                dispatched: {
                    item: {
                        id: 1,
                        assignId: 1,
                        typeId: 7,
                        attributes: [],
                        name: "Windforce",
                        createdAt,
                        updatedAt,
                    },
                    itemSockets: [
                        { id: 10, assignId: 10, itemId: 1, socketedItemId: 100, createdAt, updatedAt: null },
                        { id: 20, assignId: 20, itemId: 1, socketedItemId: 200, createdAt, updatedAt: null },
                        { id: 30, assignId: 30, itemId: 1, socketedItemId: 300, createdAt, updatedAt: null },
                    ],
                },
                output: [],
            };
        });

        it("using a delete mutator", async () => {
            // arrange
            const deleteItems = repository.useRpg().useDeleteItems();
            const deleteItemSockets = repository.useRpg().useDeleteItemSockets();

            // act
            const saved = await workspace.in(ItemBlueprint).select({ sockets: true }).save([], [windforce.input]);

            // assert
            expect(deleteItemSockets).toHaveBeenCalledBefore(deleteItems);
            expect(deleteItemSockets).toHaveBeenCalledWith<Parameters<DeleteEntitiesFn<ItemSocketBlueprint>>>({
                entities: windforce.dispatched.itemSockets,
                selection: {},
            });
            expect(deleteItems).toHaveBeenCalledWith<Parameters<DeleteEntitiesFn<ItemBlueprint>>>({
                entities: [windforce.dispatched.item],
                selection: {},
            });
            expect(saved).toEqual(windforce.output);
        });
    });
});

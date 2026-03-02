import { Item, ItemBlueprint, ItemSocketBlueprint } from "@entity-space/elements/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { EntityWorkspace } from "../../entity-workspace";
import { DeleteEntitiesFn } from "../../mutation/entity-mutation-function.type";
import { TestFacade, TestRepository } from "../../testing";

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

    it("should only delete inbound relations", async () => {
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
        expect(deleteItems).toHaveBeenCalledWith<Parameters<DeleteEntitiesFn<ItemBlueprint>>>({
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
        expect(deleteItemSockets).toHaveBeenCalledBefore(deleteItems);
        expect(deleteItemSockets).toHaveBeenCalledWith<Parameters<DeleteEntitiesFn<ItemSocketBlueprint>>>({
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

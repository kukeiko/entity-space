import { Item, ItemBlueprint, ItemSocketBlueprint } from "@entity-space/elements/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { EntityWorkspace } from "../../entity-workspace";
import { DeleteEntitiesFn } from "../../mutation/entity-mutation-function.type";
import { TestFacade, TestRepository } from "../../testing";

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

    describe("should delete children only if empty array is provided explicitly", () => {
        it("empty array is provided", async () => {
            // arrange
            const deleteItemSocket = repository.useRpg().useDeleteItemSockets();

            const windforce: Item = {
                id: 1,
                name: "Windforce",
                sockets: [], // empty array is explicitly provided, expecting the previous sockets to be deleted
                assignId: 1,
                attributes: [],
                createdAt,
                typeId: 7,
                updatedAt,
            };

            const windforcePrevious: Item = {
                id: 1,
                assignId: 1,
                typeId: 7,
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
            expect(deleteItemSocket).toHaveBeenCalledWith<Parameters<DeleteEntitiesFn<ItemSocketBlueprint>>>({
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
        });

        it("empty array is omitted", async () => {
            // arrange
            const deleteItemSocket = repository.useRpg().useDeleteItemSockets();

            const windforce: Item = {
                id: 1,
                name: "Windforce",
                // no sockets array is provided -> no sockets should be deleted
                attributes: [],
                createdAt,
                typeId: 7,
                updatedAt,
                assignId: 1,
            };

            const windforcePrevious: Item = {
                id: 1,
                assignId: 1,
                typeId: 7,
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
        });
    });
});

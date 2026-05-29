import { Item, ItemBlueprint } from "@entity-space/elements/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { EntityWorkspace } from "../../entity-workspace";
import { UpdateEntitiesFn } from "../../mutation/entity-mutation-function.type";
import { TestFacade, TestRepository } from "../../testing";

describe("save() change detection", () => {
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

    describe("should recognize changes on embedded arrays", () => {
        it("when entries changed", async () => {
            const updateItems = repository.useRpg().useUpdateItems(updatedAt);

            // arrange
            const windforceOriginal: Item = workspace.from(ItemBlueprint).construct({
                id: 1,
                attributes: [
                    { typeId: 1, values: [40] }, // this will change
                    { typeId: 2, values: [100] },
                    { typeId: 3, values: [50] }, // this will change
                ],
            });

            const windforceChanged: Item = workspace.from(ItemBlueprint).construct({
                id: 1,
                attributes: [
                    { typeId: 1, values: [30] }, // this has changed
                    { typeId: 2, values: [100] },
                    { typeId: 3, values: [60] }, // this has changed
                ],
            });

            const windforcePassedToUpdate: Item = workspace.from(ItemBlueprint).construct({
                id: 1,
                attributes: [
                    { typeId: 1, values: [30] },
                    { typeId: 2, values: [100] },
                    { typeId: 3, values: [60] },
                ],
            });

            // act
            await workspace.in(ItemBlueprint).save(windforceChanged, windforceOriginal);

            // assert
            expect(updateItems).toHaveBeenCalledWith<Parameters<UpdateEntitiesFn<ItemBlueprint>>>({
                entities: [windforcePassedToUpdate],
                selection: {},
            });
        });

        it("when entries are added", async () => {
            const updateItems = repository.useRpg().useUpdateItems(updatedAt);

            // arrange
            const windforceOriginal: Item = workspace.from(ItemBlueprint).construct({
                id: 1,
                attributes: [
                    { typeId: 1, values: [40] },
                    { typeId: 3, values: [50] },
                ],
            });

            const windforceChanged: Item = workspace.from(ItemBlueprint).construct({
                id: 1,
                attributes: [
                    { typeId: 1, values: [40] },
                    { typeId: 2, values: [100] }, // this got added
                    { typeId: 3, values: [50] },
                ],
            });

            const windforcePassedToUpdate: Item = workspace.from(ItemBlueprint).construct({
                id: 1,
                attributes: [
                    { typeId: 1, values: [40] },
                    { typeId: 2, values: [100] },
                    { typeId: 3, values: [50] },
                ],
            });

            // act
            await workspace.in(ItemBlueprint).save(windforceChanged, windforceOriginal);

            // assert
            expect(updateItems).toHaveBeenCalledWith<Parameters<UpdateEntitiesFn<ItemBlueprint>>>({
                entities: [windforcePassedToUpdate],
                selection: {},
            });
        });

        it("when entries are removed", async () => {
            const updateItems = repository.useRpg().useUpdateItems(updatedAt);

            // arrange
            const windforceOriginal: Item = workspace.from(ItemBlueprint).construct({
                id: 1,
                attributes: [
                    { typeId: 1, values: [40] },
                    { typeId: 2, values: [100] }, // this will be removed
                    { typeId: 3, values: [50] },
                ],
            });

            const windforceChanged: Item = workspace.from(ItemBlueprint).construct({
                id: 1,
                attributes: [
                    { typeId: 1, values: [40] },
                    { typeId: 3, values: [50] },
                ],
            });

            const windforcePassedToUpdate: Item = workspace.from(ItemBlueprint).construct({
                id: 1,
                attributes: [
                    { typeId: 1, values: [40] },
                    { typeId: 3, values: [50] },
                ],
            });

            // act
            await workspace.in(ItemBlueprint).save(windforceChanged, windforceOriginal);

            // assert
            expect(updateItems).toHaveBeenCalledWith<Parameters<UpdateEntitiesFn<ItemBlueprint>>>({
                entities: [windforcePassedToUpdate],
                selection: {},
            });
        });
    });

    it("should do nothing if there is no difference in updatable changes", async () => {
        // arrange
        const updateItems = repository.useRpg().useUpdateItems(updatedAt);
        const updateItemSockets = repository.useRpg().useUpdateItemSockets(updatedAt);

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
});

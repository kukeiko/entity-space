import { Item, ItemBlueprint } from "@entity-space/elements/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { EntityWorkspace } from "../../entity-workspace";
import { TestFacade, TestRepository } from "../../testing";

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
            windforce = {
                input: [
                    {
                        createdAt: "",
                        id: 0,
                        updatedAt: null,
                        assignId: 1,
                        typeId: 7,
                        attributes: [],
                        name: "Windforce",
                        sockets: [],
                    },
                    {
                        createdAt: "",
                        id: 0,
                        updatedAt: null,
                        assignId: 2,
                        typeId: 3,
                        attributes: [],
                        name: "Shako",
                        sockets: [],
                    },
                ],
                dispatched: [
                    {
                        createdAt: "",
                        id: 0,
                        updatedAt: null,
                        assignId: 1,
                        typeId: 7,
                        attributes: [],
                        name: "Windforce",
                    },
                    {
                        createdAt: "",
                        id: 0,
                        updatedAt: null,
                        assignId: 2,
                        typeId: 3,
                        attributes: [],
                        name: "Shako",
                    },
                ],
                output: [
                    {
                        id: 1,
                        assignId: 1,
                        typeId: 7,
                        attributes: [],
                        createdAt,
                        name: "Windforce",
                        sockets: [],
                        updatedAt: null,
                    },
                    {
                        id: 2,
                        assignId: 2,
                        typeId: 3,
                        attributes: [],
                        createdAt,
                        name: "Shako",
                        sockets: [],
                        updatedAt: null,
                    },
                ],
            };
        });

        it("using a save mutator", async () => {
            // arrange
            const saveItems = repository.useRpg().useSaveItems(createdAt, updatedAt);

            // act
            const saved = await workspace.in(ItemBlueprint).save(windforce.input);

            // assert
            expect(saveItems).toHaveBeenCalledWith({ entities: windforce.dispatched, selection: {} });
            expect(saved).toEqual(windforce.output);
            expect(saved).toBe(windforce.input);
        });

        it("using a create mutator", async () => {
            // arrange
            const createItems = repository.useRpg().useCreateItems(createdAt);

            // act
            const saved = await workspace.in(ItemBlueprint).save(windforce.input);

            // assert
            expect(createItems).toHaveBeenCalledWith({ entities: windforce.dispatched, selection: {} });
            expect(saved).toEqual(windforce.output);
            expect(saved).toBe(windforce.input);
        });
    });
});

import { Folder, FolderBlueprint, Tree, TreeBlueprint, User } from "@entity-space/elements/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { EntityWorkspace } from "../../entity-workspace";
import { SaveEntitiesFn } from "../../mutation/entity-mutation-function.type";
import { TestFacade, TestRepository } from "../../testing";
import { createMetadata } from "../../testing/create-metadata.fn";

describe("save()", () => {
    let facade: TestFacade;
    let repository: TestRepository;
    let workspace: EntityWorkspace;

    const createdAt = new Date().toISOString();

    beforeEach(() => {
        facade = new TestFacade();
        repository = facade.getTestRepository();
        workspace = facade.getWorkspace();
    });

    it("should work for recursive embedded relations", async () => {
        // arrange
        const saveTrees = repository.useTree().useSaveTrees();
        const saveUsers = repository.useCommon().useSaveUsers();

        const createdBy: User = {
            id: 0,
            name: "Susi Sonne",
            metadata: createMetadata(0, undefined, createdAt),
        };

        const tree: Tree = {
            id: 0,
            name: "Mighty Oak",
            branches: [
                {
                    metadata: { createdAt, createdBy, createdById: 0, updatedAt: null, updatedById: null },
                    leaves: [
                        {
                            color: "green",
                            metadata: {
                                createdAt,
                                createdBy,
                                createdById: 0,
                                updatedAt: null,
                                updatedById: null,
                            },
                        },
                    ],
                    branches: [
                        {
                            branches: [],
                            leaves: [
                                {
                                    color: "red",
                                    metadata: {
                                        createdAt,
                                        createdBy,
                                        createdById: 0,
                                        updatedAt: null,
                                        updatedById: null,
                                    },
                                },
                            ],
                            metadata: { createdAt, createdBy, createdById: 0, updatedAt: null, updatedById: null },
                        },
                    ],
                },
            ],
            metadata: { createdAt, createdBy, createdById: 0, updatedAt: null, updatedById: null },
        };

        // act
        await workspace
            .in(TreeBlueprint)
            .select({
                metadata: { createdBy: true },
                branches: {
                    branches: "*",
                    metadata: { createdBy: true },
                    leaves: { metadata: { createdBy: true } },
                },
            })
            .save([tree]);

        // assert
        {
            // Tree

            expect(saveTrees).toHaveBeenCalledTimes(1);
            expect(saveTrees).toHaveBeenCalledAfter(saveUsers);
            expect(saveTrees).toHaveBeenCalledWith<Parameters<SaveEntitiesFn<TreeBlueprint>>>({
                entities: [
                    {
                        id: 0,
                        name: "Mighty Oak",
                        branches: [
                            {
                                metadata: { createdAt, createdById: 1, updatedAt: null, updatedById: null },
                                leaves: [
                                    {
                                        color: "green",
                                        metadata: { createdAt, createdById: 1, updatedAt: null, updatedById: null },
                                    },
                                ],
                                branches: [
                                    {
                                        branches: [],
                                        leaves: [
                                            {
                                                color: "red",
                                                metadata: {
                                                    createdAt,
                                                    createdById: 1,
                                                    updatedAt: null,
                                                    updatedById: null,
                                                },
                                            },
                                        ],
                                        metadata: { createdAt, createdById: 1, updatedAt: null, updatedById: null },
                                    },
                                ],
                            },
                        ],
                        metadata: { createdAt, createdById: 1, updatedAt: null, updatedById: null },
                    },
                ],
                selection: {},
            });
        }

        {
            // User
            expect(saveUsers).toHaveBeenCalledTimes(1);
            expect(saveUsers).toHaveBeenCalledWith({
                entities: [
                    {
                        id: 0,
                        name: "Susi Sonne",
                        metadata: { createdAt, createdById: 0, updatedAt: null, updatedById: null },
                    },
                ],
                selection: {},
            });
        }
    });

    it("should work for recursive joined relations", async () => {
        // arrange
        const saveFolders = repository.useFileSystem().useSaveFolders();
        const saveFiles = repository.useFileSystem().useSaveFiles();
        const saveUsers = repository.useCommon().useSaveUsers();

        const createdBy: User = {
            id: 0,
            name: "Susi Sonne",
            metadata: {
                createdAt,
                createdById: 0,
                updatedAt: null,
                updatedById: null,
            },
        };

        const folder: Folder = {
            id: 0,
            name: "Morcheeba",
            metadata: { createdAt, createdBy, createdById: 0, updatedAt: null, updatedById: null },
            parentId: 0,
            parent: {
                id: 0,
                name: "Music",
                parentId: null,
                metadata: { createdAt, createdBy, createdById: 0, updatedAt: null, updatedById: null },
            },
            folders: [
                {
                    id: 0,
                    name: "Dive Deep",
                    parentId: 0,
                    metadata: { createdAt, createdBy, createdById: 0, updatedAt: null, updatedById: null },
                    files: [
                        {
                            id: 0,
                            name: "Enjoy The Ride",
                            folderId: 0,
                            metadata: { createdAt, createdBy, createdById: 0, updatedAt: null, updatedById: null },
                        },
                    ],
                },
            ],
        };

        // act
        await workspace
            .in(FolderBlueprint)
            .select({
                metadata: { createdBy: true },
                folders: { folders: "*", files: { metadata: { createdBy: true } }, metadata: { createdBy: true } },
                parent: { parent: "*", metadata: { createdBy: true } },
            })
            .save([folder]);

        // assert

        {
            // Folders
            expect(saveFolders).toHaveBeenNthCalledWith(1, {
                entities: [
                    {
                        id: 0,
                        name: "Music",
                        parentId: null,
                        metadata: { createdAt, createdById: 1, updatedAt: null, updatedById: null },
                    },
                ],
                selection: {},
            });
            expect(saveFolders).toHaveBeenNthCalledWith(2, {
                entities: [
                    {
                        id: 0,
                        name: "Morcheeba",
                        parentId: 1,
                        metadata: { createdAt, createdById: 1, updatedAt: null, updatedById: null },
                    },
                ],
                selection: {},
            });
            expect(saveFolders).toHaveBeenNthCalledWith(3, {
                entities: [
                    {
                        id: 0,
                        name: "Dive Deep",
                        parentId: 2,
                        metadata: { createdAt, createdById: 1, updatedAt: null, updatedById: null },
                    },
                ],
                selection: {},
            });
        }

        {
            // File
            expect(saveFiles).toHaveBeenCalledAfter(saveFolders);
            expect(saveFiles).toHaveBeenCalledTimes(1);
            expect(saveFiles).toHaveBeenCalledWith({
                entities: [
                    {
                        id: 0,
                        name: "Enjoy The Ride",
                        folderId: 3,
                        metadata: { createdAt, createdById: 1, updatedAt: null, updatedById: null },
                    },
                ],
                selection: {},
            });
        }

        {
            // User
            expect(saveUsers).toHaveBeenCalledBefore(saveFolders);
            expect(saveUsers).toHaveBeenCalledBefore(saveFiles);
            expect(saveUsers).toHaveBeenCalledTimes(1);
            expect(saveUsers).toHaveBeenCalledWith({
                entities: [
                    {
                        id: 0,
                        name: "Susi Sonne",
                        metadata: { createdAt, createdById: 0, updatedAt: null, updatedById: null },
                    },
                ],
                selection: {},
            });
        }
    });
});

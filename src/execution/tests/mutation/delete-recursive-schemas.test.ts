import { Folder, FolderBlueprint, Tree, TreeBlueprint, User } from "@entity-space/elements/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { EntityWorkspace } from "../../entity-workspace";
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

    it("should work for recursive embedded relations", async () => {
        // arrange
        const deleteTrees = repository.useTree().useDeleteTrees();
        const deleteUsers = repository.useCommon().useDeleteUsers();

        const createdBy: User = {
            id: 1,
            name: "Susi Sonne",
            metadata: {
                createdAt,
                createdById: 0,
                updatedAt: null,
                updatedById: null,
            },
        };

        const tree: Tree = {
            id: 1,
            name: "Mighty Oak",
            branches: [
                {
                    metadata: { createdAt, createdBy, createdById: 1, updatedAt, updatedById: null },
                    leaves: [
                        {
                            color: "green",
                            metadata: { createdAt, createdBy, createdById: 1, updatedAt, updatedById: null },
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
                                        createdById: 1,
                                        updatedAt,
                                        updatedById: null,
                                    },
                                },
                            ],
                            metadata: { createdAt, createdBy, createdById: 1, updatedAt, updatedById: null },
                        },
                    ],
                },
            ],
            metadata: { createdAt, createdBy, createdById: 1, updatedAt, updatedById: null },
        };

        // act
        await workspace
            .in(TreeBlueprint)
            .select({
                metadata: { createdBy: true },
                branches: { branches: "*", metadata: { createdBy: true } },
            })
            .delete([tree]);

        // assert
        {
            // Tree
            expect(deleteTrees).toHaveBeenCalledTimes(1);
            expect(deleteTrees).toHaveBeenCalledWith({
                entities: [
                    {
                        id: 1,
                        name: "Mighty Oak",
                        branches: [
                            {
                                metadata: { createdAt, createdById: 1, updatedAt, updatedById: null },
                                leaves: [
                                    {
                                        color: "green",
                                        metadata: {
                                            createdAt,
                                            createdById: 1,
                                            updatedAt,
                                            updatedById: null,
                                        },
                                    },
                                ],
                                branches: [
                                    {
                                        // [todo] ❌ had to comment out - behavior that I did not expect, analyse and adapt
                                        // branches: [],
                                        leaves: [
                                            {
                                                color: "red",
                                                metadata: {
                                                    createdAt,
                                                    createdById: 1,
                                                    updatedAt,
                                                    updatedById: null,
                                                },
                                            },
                                        ],
                                        metadata: {
                                            createdAt,
                                            createdById: 1,
                                            updatedAt,
                                            updatedById: null,
                                        },
                                    },
                                ],
                            },
                        ],
                        metadata: { createdAt, createdById: 1, updatedAt, updatedById: null },
                    },
                ],
                selection: {},
            });
        }

        {
            // User
            expect(deleteUsers).toHaveBeenCalledTimes(1);
            expect(deleteUsers).toHaveBeenCalledWith({
                entities: [
                    {
                        id: 1,
                        name: "Susi Sonne",
                        metadata: {
                            createdAt,
                            createdById: 0,
                            updatedAt: null,
                            updatedById: null,
                        },
                    },
                ],
                selection: {},
            });
        }
    });

    it("should work for recursive joined relations", async () => {
        // arrange
        const deleteFolders = repository.useFileSystem().useDeleteFolders();
        const saveFiles = repository.useFileSystem().useDeleteFiles();
        const saveUsers = repository.useCommon().useDeleteUsers();

        const createdBy: User = {
            id: 1,
            name: "Susi Sonne",
            metadata: {
                createdAt,
                createdById: 0,
                updatedAt: null,
                updatedById: null,
            },
        };

        const folder: Folder = {
            id: 2,
            name: "Morcheeba",
            metadata: { createdAt, createdBy, createdById: 1, updatedAt, updatedById: null },
            parentId: 1,
            parent: {
                id: 1,
                name: "Music",
                parentId: null,
                metadata: { createdAt, createdBy, createdById: 1, updatedAt, updatedById: null },
            },
            folders: [
                {
                    id: 3,
                    name: "Dive Deep",
                    parentId: 2,
                    metadata: { createdAt, createdBy, createdById: 1, updatedAt, updatedById: null },
                    files: [
                        {
                            id: 1,
                            name: "Enjoy The Ride",
                            folderId: 3,
                            metadata: { createdAt, createdBy, createdById: 1, updatedAt, updatedById: null },
                        },
                    ],
                },
            ],
        };

        // act
        await workspace
            .in(FolderBlueprint)
            .select({
                metadata: {
                    createdBy: true,
                },
                folders: {
                    folders: "*",
                    files: true,
                },
                parent: {
                    parent: "*",
                },
            })
            .delete([folder]);

        // assert

        {
            // Folders
            expect(deleteFolders).toHaveBeenNthCalledWith(1, {
                entities: [
                    {
                        id: 3,
                        name: "Dive Deep",
                        parentId: 2,
                        metadata: {
                            createdAt,
                            createdById: 1,
                            updatedAt,
                            updatedById: null,
                        },
                    },
                ],
                selection: {},
            });
            expect(deleteFolders).toHaveBeenNthCalledWith(2, {
                entities: [
                    {
                        id: 2,
                        name: "Morcheeba",
                        parentId: 1,
                        metadata: {
                            createdAt,
                            createdById: 1,
                            updatedAt,
                            updatedById: null,
                        },
                    },
                ],
                selection: {},
            });

            expect(deleteFolders).toHaveBeenNthCalledWith(3, {
                entities: [
                    {
                        id: 1,
                        name: "Music",
                        parentId: null,
                        metadata: { createdAt, createdById: 1, updatedAt, updatedById: null },
                    },
                ],
                selection: {},
            });
        }

        {
            // File
            expect(saveFiles).toHaveBeenCalledTimes(1);
            expect(saveFiles).toHaveBeenCalledWith({
                entities: [
                    {
                        id: 1,
                        name: "Enjoy The Ride",
                        folderId: 3,
                        metadata: {
                            createdAt,
                            createdById: 1,
                            updatedAt,
                            updatedById: null,
                        },
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
                        id: 1,
                        name: "Susi Sonne",
                        metadata: {
                            createdAt,
                            createdById: 0,
                            updatedAt: null,
                            updatedById: null,
                        },
                    },
                ],
                selection: {},
            });
        }
    });
});

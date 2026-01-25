import {
    FileBlueprint,
    Folder,
    FolderBlueprint,
    Tree,
    TreeBlueprint,
    User,
    UserBlueprint,
} from "@entity-space/elements/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { EntityWorkspace } from "../../entity-workspace";
import { DeleteEntitiesFn } from "../../mutation/entity-mutation-function.type";
import { TestFacade, TestRepository } from "../../testing";
import { createMetadata_V2 } from "../../testing/create-metadata.fn";

describe("delete()", () => {
    let facade: TestFacade;
    let repository: TestRepository;
    let workspace: EntityWorkspace;

    beforeEach(() => {
        facade = new TestFacade();
        repository = facade.getTestRepository();
        workspace = facade.getWorkspace();
    });

    it("should work for recursive embedded relations", async () => {
        // arrange
        const deleteTrees = repository.useTree().useDeleteTrees();
        const deleteUsers = repository.useCommon().useDeleteUsers();
        const createdBy: User = { id: 1, name: "Susi Sonne", metadata: createMetadata_V2(0) };
        const metadata = createMetadata_V2(createdBy);
        const deletedMetadata = createMetadata_V2(createdBy.id);

        const tree: Tree = {
            id: 1,
            name: "Mighty Oak",
            branches: [
                {
                    metadata,
                    leaves: [{ color: "green", metadata }],
                    branches: [
                        {
                            branches: [],
                            leaves: [{ color: "red", metadata }],
                            metadata,
                        },
                    ],
                },
            ],
            metadata,
        };

        // act
        await workspace
            .in(TreeBlueprint)
            .select({
                metadata: { createdBy: true },
                branches: { branches: "*", metadata: { createdBy: true } },
            })
            .delete(tree);

        // assert
        {
            // Tree
            expect(deleteTrees).toHaveBeenCalledTimes(1);
            expect(deleteTrees).toHaveBeenCalledWith<Parameters<DeleteEntitiesFn<TreeBlueprint>>>({
                entities: [
                    {
                        id: 1,
                        name: "Mighty Oak",
                        metadata: deletedMetadata,
                        branches: [
                            {
                                metadata: deletedMetadata,
                                leaves: [{ color: "green", metadata: deletedMetadata }],
                                branches: [
                                    {
                                        branches: [],
                                        leaves: [{ color: "red", metadata: deletedMetadata }],
                                        metadata: deletedMetadata,
                                    },
                                ],
                            },
                        ],
                    },
                ],
                selection: {},
            });
        }

        {
            // User
            expect(deleteUsers).toHaveBeenCalledTimes(1);
            expect(deleteUsers).toHaveBeenCalledAfter(deleteTrees);
            expect(deleteUsers).toHaveBeenCalledWith<Parameters<DeleteEntitiesFn<UserBlueprint>>>({
                entities: [{ id: 1, name: "Susi Sonne", metadata: createMetadata_V2(0) }],
                selection: {},
            });
        }
    });

    it("should work for recursive joined relations", async () => {
        // arrange
        const deleteFolders = repository.useFileSystem().useDeleteFolders();
        const deleteFiles = repository.useFileSystem().useDeleteFiles();
        const deleteUsers = repository.useCommon().useDeleteUsers();

        const createdBy: User = {
            id: 1,
            name: "Susi Sonne",
            metadata: createMetadata_V2(0),
        };

        const metadata = createMetadata_V2(createdBy);
        const deletedMetadata = createMetadata_V2(createdBy.id);

        const folder: Folder = {
            id: 2,
            name: "Morcheeba",
            metadata,
            parentId: 1,
            parent: {
                id: 1,
                name: "Music",
                parentId: null,
                metadata,
            },
            folders: [
                {
                    id: 3,
                    name: "Dive Deep",
                    parentId: 2,
                    metadata,
                    files: [
                        {
                            id: 1,
                            name: "Enjoy The Ride",
                            folderId: 3,
                            metadata,
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
                folders: { folders: "*", files: true },
                parent: { parent: "*" },
            })
            .delete([folder]);

        // assert

        {
            // Folders
            expect(deleteFolders).toHaveBeenNthCalledWith<Parameters<DeleteEntitiesFn<FolderBlueprint>>>(1, {
                entities: [{ id: 3, name: "Dive Deep", parentId: 2, metadata: deletedMetadata }],
                selection: {},
            });

            expect(deleteFolders).toHaveBeenNthCalledWith<Parameters<DeleteEntitiesFn<FolderBlueprint>>>(2, {
                entities: [{ id: 2, name: "Morcheeba", parentId: 1, metadata: deletedMetadata }],
                selection: {},
            });

            expect(deleteFolders).toHaveBeenNthCalledWith<Parameters<DeleteEntitiesFn<FolderBlueprint>>>(3, {
                entities: [{ id: 1, name: "Music", parentId: null, metadata: deletedMetadata }],
                selection: {},
            });
        }

        {
            // File
            expect(deleteFiles).toHaveBeenCalledTimes(1);
            expect(deleteFiles).toHaveBeenCalledBefore(deleteFolders);
            expect(deleteFiles).toHaveBeenCalledWith<Parameters<DeleteEntitiesFn<FileBlueprint>>>({
                entities: [{ id: 1, name: "Enjoy The Ride", folderId: 3, metadata: deletedMetadata }],
                selection: {},
            });
        }

        {
            // User
            expect(deleteUsers).toHaveBeenCalledTimes(1);
            expect(deleteUsers).toHaveBeenCalledAfter(deleteFolders);
            expect(deleteUsers).toHaveBeenCalledWith<Parameters<DeleteEntitiesFn<UserBlueprint>>>({
                entities: [{ id: 1, name: "Susi Sonne", metadata: createMetadata_V2(0) }],
                selection: {},
            });
        }
    });
});

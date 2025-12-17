import {
    FolderBlueprint,
    FolderSavable,
    TreeBlueprint,
    TreeSavable,
    UserSavable,
} from "@entity-space/elements/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { EntityWorkspace } from "../../entity-workspace";
import { TestFacade, TestRepository } from "../../testing";

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

        const createdBy: UserSavable = {
            name: "Susi Sonne",
            metadata: {
                createdAt,
                createdById: 0,
            },
        };

        const tree: TreeSavable = {
            name: "Mighty Oak",
            branches: [
                {
                    leaves: [{ color: "green", metadata: { createdAt, createdBy } }],
                    branches: [
                        {
                            leaves: [{ color: "red", metadata: { createdAt, createdBy } }],
                            metadata: { createdAt, createdBy },
                        },
                    ],
                },
            ],
            metadata: { createdAt, createdBy },
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
            expect(saveTrees).toHaveBeenCalledWith({
                entities: [
                    {
                        name: "Mighty Oak",
                        branches: [
                            {
                                leaves: [{ color: "green", metadata: { createdAt, createdById: 1 } }],
                                branches: [
                                    {
                                        leaves: [{ color: "red", metadata: { createdAt, createdById: 1 } }],
                                        metadata: { createdAt, createdById: 1 },
                                    },
                                ],
                            },
                        ],
                        metadata: { createdAt, createdById: 1 },
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
                        name: "Susi Sonne",
                        metadata: { createdAt, createdById: 0 },
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

        const createdBy: UserSavable = {
            name: "Susi Sonne",
            metadata: {
                createdAt,
                createdById: 0,
            },
        };

        const folder: FolderSavable = {
            name: "Morcheeba",
            metadata: { createdAt, createdBy },
            parentId: 0,
            parent: {
                name: "Music",
                parentId: null,
                metadata: { createdAt, createdBy },
            },
            folders: [
                {
                    name: "Dive Deep",
                    parentId: 0,
                    metadata: { createdAt, createdBy },
                    files: [
                        {
                            name: "Enjoy The Ride",
                            folderId: 0,
                            metadata: { createdAt, createdBy },
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
                entities: [{ name: "Music", parentId: null, metadata: { createdAt, createdById: 1 } }],
                selection: {},
            });
            expect(saveFolders).toHaveBeenNthCalledWith(2, {
                entities: [{ name: "Morcheeba", parentId: 1, metadata: { createdAt, createdById: 1 } }],
                selection: {},
            });
            expect(saveFolders).toHaveBeenNthCalledWith(3, {
                entities: [{ name: "Dive Deep", parentId: 2, metadata: { createdAt, createdById: 1 } }],
                selection: {},
            });
        }

        {
            // File
            expect(saveFiles).toHaveBeenCalledTimes(1);
            expect(saveFiles).toHaveBeenCalledWith({
                entities: [{ name: "Enjoy The Ride", folderId: 3, metadata: { createdAt, createdById: 1 } }],
                selection: {},
            });
        }

        {
            // User
            expect(saveUsers).toHaveBeenCalledTimes(1);
            expect(saveUsers).toHaveBeenCalledWith({
                entities: [{ name: "Susi Sonne", metadata: { createdAt, createdById: 0 } }],
                selection: {},
            });
        }
    });
});

import { PackedEntitySelection } from "@entity-space/elements";
import { Folder, FolderBlueprint, Tree, TreeBlueprint, TreeBranch, User } from "@entity-space/elements/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { EntityWorkspace } from "../entity-workspace";
import { TestFacade, TestRepository } from "../testing";
import { createMetadata } from "../testing/create-metadata.fn";

describe("get()", () => {
    let facade: TestFacade;
    let repository: TestRepository;
    let workspace: EntityWorkspace;

    let users: User[] = [];
    let trees: Tree[] = [];
    let folders: Folder[] = [];

    beforeEach(() => {
        facade = new TestFacade();
        repository = facade.getTestRepository();
        workspace = facade.getWorkspace();

        users = [
            { id: 1, name: "Admin", metadata: createMetadata(0) },
            { id: 2, name: "Susi Sonne", metadata: createMetadata(0) },
        ];

        trees = [
            {
                id: 1,
                name: "Mighty Oak",
                metadata: createMetadata(1, 2),
                branches: [
                    {
                        metadata: createMetadata(2, 1),
                        branches: [],
                        leaves: [
                            {
                                color: "green",
                                metadata: createMetadata(2),
                            },
                            {
                                color: "green",
                                metadata: createMetadata(2, 1),
                            },
                        ],
                    },
                    {
                        metadata: createMetadata(1, 2),
                        branches: [
                            {
                                metadata: createMetadata(1),
                                branches: [],
                                leaves: [
                                    {
                                        color: "orange",
                                        metadata: createMetadata(2),
                                    },
                                ],
                            },
                            {
                                metadata: createMetadata(1),
                                branches: [],
                                leaves: [
                                    {
                                        color: "orange",
                                        metadata: createMetadata(2),
                                    },
                                    {
                                        color: "green",
                                        metadata: createMetadata(2),
                                    },
                                ],
                            },
                        ],
                        leaves: [
                            {
                                color: "orange",
                                metadata: createMetadata(2, 1),
                            },
                        ],
                    },
                ],
            },
        ];

        folders = [
            {
                id: 1,
                name: "music",
                parentId: null,
                metadata: createMetadata(1),
            },
            {
                id: 2,
                name: "Morcheeba",
                parentId: 1,
                metadata: createMetadata(2, 1),
            },
            {
                id: 3,
                name: "Deep Dive",
                parentId: 2,
                metadata: createMetadata(2, 1),
            },
        ];
    });

    describe("recursive schemas on embedded relations", () => {
        it("works w/ default selection", async () => {
            // arrange
            repository.useTree().useEntities({ trees });
            repository.useTree().useLoadAllTrees();

            // act
            const tree = await workspace.from(TreeBlueprint).where({ id: 1 }).getOne();

            // assert
            expect(tree).toEqual(trees.find(tree => tree.id === 1));
        });

        it("works w/ extra selections (on a non-recursive entry)", async () => {
            // arrange
            repository.useCommon().useEntities({ users });
            repository.useCommon().useLoadUserById();
            repository.useTree().useEntities({ trees });
            repository.useTree().useLoadAllTrees();

            const expected = structuredClone(trees.find(tree => tree.id === 1)!);

            for (const branch of expected.branches) {
                branch.metadata.createdBy = users.find(user => user.id === branch.metadata.createdById);
            }

            const recursiveSelection = {
                branches: {
                    metadata: { createdBy: true },
                },
            } satisfies PackedEntitySelection<Tree>;

            // act
            const actual = await workspace.from(TreeBlueprint).where({ id: 1 }).select(recursiveSelection).getOne();

            // assert
            expect(actual).toEqual(expected);
        });

        it("works w/ extra selections (on a recursive entry)", async () => {
            // arrange
            repository.useCommon().useEntities({ users });
            repository.useCommon().useLoadUserById();
            repository.useTree().useEntities({ trees });
            repository.useTree().useLoadAllTrees();

            const expected = structuredClone(trees.find(tree => tree.id === 1)!);

            const hydrateBranchCreatedBy = (branches: TreeBranch[]) => {
                for (const branch of branches) {
                    branch.metadata.createdBy = users.find(user => user.id === branch.metadata.createdById);
                    hydrateBranchCreatedBy(branch.branches);
                }
            };

            hydrateBranchCreatedBy(expected.branches);

            const recursiveSelection = {
                branches: {
                    metadata: { createdBy: true },
                    branches: {}, // recursive
                },
            } satisfies PackedEntitySelection<Tree>;

            recursiveSelection.branches.branches = recursiveSelection.branches;

            // act
            const actual = await workspace.from(TreeBlueprint).where({ id: 1 }).select(recursiveSelection).getOne();

            // assert
            expect(actual).toEqual(expected);
        });

        it("works w/ extra selection (on a recursive entry, & source supports non-recursive extra selection)", async () => {
            // arrange
            repository.useTree().useEntities({ trees, users });
            repository.useTree().useLoadAllTreesWithFirstLevelBranchesMetadataCreatedBy();
            repository.useCommon().useEntities({ users });
            repository.useCommon().useLoadUserById();

            const expected = structuredClone(trees.find(tree => tree.id === 1)!);

            const hydrateBranchCreatedBy = (branches: TreeBranch[]) => {
                for (const branch of branches) {
                    branch.metadata.createdBy = users.find(user => user.id === branch.metadata.createdById);
                    hydrateBranchCreatedBy(branch.branches);
                }
            };

            hydrateBranchCreatedBy(expected.branches);

            const recursiveSelection = {
                branches: {
                    metadata: { createdBy: true },
                    branches: {}, // recursive
                },
            } satisfies PackedEntitySelection<Tree>;

            recursiveSelection.branches.branches = recursiveSelection.branches;

            // act
            const actual = await workspace.from(TreeBlueprint).where({ id: 1 }).select(recursiveSelection).getOne();

            // assert
            expect(actual).toEqual(expected);
        });
    });

    describe("recursive schemas on joined relations", () => {
        it("should work with one recursive relation", async () => {
            // arrange
            repository.useFileSystem().useEntities({ folders });
            repository.useFileSystem().useLoadAllFolders();

            // [todo] ❌ use "*" once support for it has been implemented
            const selection = { folders: "*" } satisfies PackedEntitySelection<Folder>;

            const expected = structuredClone(folders.find(folder => folder.id === 1)!);

            const hydrateFolders = (folder: Folder) => {
                const relatedFolders = folders.filter(candidate => candidate.parentId === folder.id);
                folder.folders = relatedFolders;

                for (const folder of relatedFolders) {
                    hydrateFolders(folder);
                }
            };

            hydrateFolders(expected);

            // act
            const actual = await workspace.from(FolderBlueprint).select(selection).where({ id: 1 }).getOne();

            // assert
            expect(actual).toEqual(expected);
        });

        // [todo] ❌ I seem to have given up?
        it.skip("should work with two recursive relations (same level)", async () => {
            // arrange
            repository.useFileSystem().useEntities({ folders });
            repository.useFileSystem().useLoadAllFolders();

            const selection = { folders: "*", parent: "*" } satisfies PackedEntitySelection<Folder>;

            // act
            const actual = await workspace.from(FolderBlueprint).select(selection).where({ id: 1 }).getOne();

            // assert
            console.dir(actual, { depth: null });
        });

        it("should work with two separate recursive relations", async () => {
            // arrange
            repository.useFileSystem().useEntities({ folders });
            repository.useFileSystem().useLoadAllFolders();

            const selection = {
                folders: { folders: "*" },
                parent: { parent: "*" },
            } satisfies PackedEntitySelection<Folder>;

            const expected = structuredClone(folders.find(folder => folder.id === 2)!);

            const hydrateFolders = (folder: Folder) => {
                const relatedFolders = folders.filter(candidate => candidate.parentId === folder.id);
                folder.folders = relatedFolders;

                for (const folder of relatedFolders) {
                    hydrateFolders(folder);
                }
            };

            hydrateFolders(expected);

            const hydrateParent = (folder: Folder) => {
                const parent = folders.find(candidate => candidate.id === folder.parentId);
                folder.parent = parent ?? null;

                if (parent) {
                    hydrateParent(parent);
                }
            };

            hydrateParent(expected);

            // act
            const actual = await workspace.from(FolderBlueprint).select(selection).where({ id: 2 }).getOne();

            // assert
            expect(actual).toEqual(expected);
        });
    });
});

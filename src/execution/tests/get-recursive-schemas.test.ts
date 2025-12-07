import { PackedEntitySelection } from "@entity-space/elements";
import { Folder, FolderBlueprint, Tree, TreeBlueprint, TreeBranch } from "@entity-space/elements/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { EntityWorkspace } from "../entity-workspace";
import { TestFacade, TestRepository } from "../testing";
import { defaultEntities } from "../testing/default-entities";

describe("get()", () => {
    let facade: TestFacade;
    let repository: TestRepository;
    let workspace: EntityWorkspace;

    beforeEach(() => {
        facade = new TestFacade();
        repository = facade.getTestRepository();
        workspace = facade.getWorkspace();
    });

    describe("recursive schemas on embedded relations", () => {
        it("works w/ default selection", async () => {
            // arrange
            repository.useDefaultEntities();
            repository.useLoadAllTrees();

            // act
            const tree = await workspace.from(TreeBlueprint).where({ id: 1 }).getOne();

            // assert
            expect(tree).toEqual(defaultEntities.trees.find(tree => tree.id === 1));
        });

        it("works w/ extra selections (on a non-recursive entry)", async () => {
            // arrange
            repository.useDefaultEntities();
            repository.useLoadAllTrees();
            repository.useLoadUserById();

            const expected = structuredClone(defaultEntities.trees.find(tree => tree.id === 1)!);

            for (const branch of expected.branches) {
                branch.metadata.createdBy = defaultEntities.users.find(user => user.id === branch.metadata.createdById);
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
            repository.useDefaultEntities();
            repository.useLoadAllTrees();
            repository.useLoadUserById();

            const expected = structuredClone(defaultEntities.trees.find(tree => tree.id === 1)!);

            const hydrateBranchCreatedBy = (branches: TreeBranch[]) => {
                for (const branch of branches) {
                    branch.metadata.createdBy = defaultEntities.users.find(
                        user => user.id === branch.metadata.createdById,
                    );
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
            repository.useDefaultEntities();
            repository.useLoadAllTreesWithFirstLevelBranchesMetadataCreatedBy();
            repository.useLoadUserById();

            const expected = structuredClone(defaultEntities.trees.find(tree => tree.id === 1)!);

            const hydrateBranchCreatedBy = (branches: TreeBranch[]) => {
                for (const branch of branches) {
                    branch.metadata.createdBy = defaultEntities.users.find(
                        user => user.id === branch.metadata.createdById,
                    );
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
            repository.useDefaultEntities();
            repository.useLoadAllFolders();

            // [todo] ❌ use "*" once support for it has been implemented
            const selection = { folders: "*" } satisfies PackedEntitySelection<Folder>;

            const expected = structuredClone(defaultEntities.folders.find(folder => folder.id === 1)!);

            const hydrateFolders = (folder: Folder) => {
                const folders = defaultEntities.folders.filter(candidate => candidate.parentId === folder.id);
                folder.folders = folders;

                for (const folder of folders) {
                    hydrateFolders(folder);
                }
            };

            hydrateFolders(expected);

            // act
            const actual = await workspace.from(FolderBlueprint).select(selection).where({ id: 1 }).getOne();

            // assert
            expect(actual).toEqual(expected);
        });

        it.skip("should work with two recursive relations (same level)", async () => {
            // arrange
            repository.useDefaultEntities();
            repository.useLoadAllFolders();

            const selection = { folders: "*", parent: "*" } satisfies PackedEntitySelection<Folder>;

            // act
            const actual = await workspace.from(FolderBlueprint).select(selection).where({ id: 1 }).getOne();

            // assert
            console.dir(actual, { depth: null });
        });

        it("should work with two separate recursive relations", async () => {
            // arrange
            repository.useDefaultEntities();
            repository.useLoadAllFolders();

            const selection = {
                folders: { folders: "*" },
                parent: { parent: "*" },
            } satisfies PackedEntitySelection<Folder>;

            const expected = structuredClone(defaultEntities.folders.find(folder => folder.id === 2)!);

            const hydrateFolders = (folder: Folder) => {
                const folders = defaultEntities.folders.filter(candidate => candidate.parentId === folder.id);
                folder.folders = folders;

                for (const folder of folders) {
                    hydrateFolders(folder);
                }
            };

            hydrateFolders(expected);

            const hydrateParent = (folder: Folder) => {
                const parent = defaultEntities.folders.find(candidate => candidate.id === folder.parentId);
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

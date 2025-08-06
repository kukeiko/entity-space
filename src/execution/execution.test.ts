import { PackedEntitySelection } from "@entity-space/elements";
import {
    Artist,
    ArtistBlueprint,
    Folder,
    FolderBlueprint,
    Song,
    Tag,
    Tree,
    TreeBlueprint,
    TreeBranch,
    User,
    UserBlueprint,
    UserRequestBlueprint,
} from "@entity-space/elements/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { EntityWorkspace } from "./entity-workspace";
import { defaultEntities } from "./testing/default-entities";
import { TestFacade } from "./testing/test-facade";
import { TestRepository } from "./testing/test-repository";

describe("execution", () => {
    let facade: TestFacade;
    let repository: TestRepository;
    let workspace: EntityWorkspace;

    beforeEach(() => {
        facade = new TestFacade();
        repository = facade.getTestRepository();
        workspace = facade.getWorkspace();
    });

    it("should hydrate one relation", async () => {
        // arrange
        const users: User[] = [
            {
                id: 1,
                name: "Susi Sonne",
                metadata: { createdById: 3, createdAt: new Date().toISOString(), updatedAt: null, updatedById: null },
            },
            {
                id: 3,
                name: "Dana Dandy",
                metadata: { createdById: 0, createdAt: new Date().toISOString(), updatedAt: null, updatedById: null },
            },
        ];

        const expected = users
            .slice(0, 1)
            .map(user => ({ ...user, metadata: { ...user.metadata, createdBy: users[1] } }));

        const load = () =>
            workspace
                .from(UserBlueprint)
                .where({ id: 1 })
                .select({ metadata: { createdBy: true } })
                .get();

        repository.useEntities({ users });
        repository.useLoadUserById();

        // act
        const loadedFromSource = await load();

        // assert
        expect(loadedFromSource).toStrictEqual(expected);
    });

    it("should work", async () => {
        /**
         * This test is a temporary one to actively check lots of features to reduce change of breaking something while developing.
         * It should be split into smaller ones at some point.
         */
        // arrange
        const users: User[] = [
            {
                id: 1,
                name: "Admin",
                metadata: { createdAt: "2025-05-19T03:27:16.292Z", createdById: 1, updatedAt: null, updatedById: null },
            },
        ];

        const tags: Tag[] = [
            { id: "upbeat", name: "Upbeat" },
            { id: "vocals", name: "Vocals" },
        ];

        const artists: Artist[] = [
            {
                id: 1,
                namespace: "dev",
                name: "N'to",
                metadata: { createdAt: "2025-05-19T03:27:16.292Z", createdById: 1, updatedAt: null, updatedById: null },
            },
            {
                id: 2,
                namespace: "prod",
                name: "So Below",
                metadata: { createdAt: "2025-05-19T03:27:16.292Z", createdById: 1, updatedAt: null, updatedById: null },
            },
        ];

        const songs: Song[] = [
            {
                id: 1,
                albumId: 0,
                artistId: 1,
                namespace: "dev",
                name: "Comite",
                duration: 336,
                tagIds: ["upbeat"],
                metadata: {
                    createdAt: "2025-05-19T03:27:16.292Z",
                    createdById: 1,
                    updatedAt: "2025-05-19T03:33:16.292Z",
                    updatedById: 2,
                },
            },
        ];

        repository.useEntities({ artists, songs, tags, users });
        repository.useLoadArtistById();
        repository.useLoadSongsByArtistId();
        repository.useLoadUserById();
        repository.useLoadTagById();

        // act
        const artist = await workspace
            .from(ArtistBlueprint)
            .select({
                metadata: true,
                songs: {
                    // [todo] ❌ tagIds is optional, so we have to add it. should be removed once hydrators can specify which properties
                    // need to be hydrated in order for them to hydrate a relation. also, EntitySource has to explicitly specify that
                    // it includes tagIds - that is a source of confusion, either not require it or warn the user that entities returned
                    // include it without the source specifying that it does.
                    tagIds: true,
                    tags: true,
                    metadata: {
                        // [todo] ❌ use "updatedBy: true" once setting unhydrated values to null works (because it could not find the updatedBy user)
                        createdBy: true,
                    },
                },
            })
            .where({ id: [1] })
            .findOne();

        // assert
        expect(artist).toEqual({
            id: 1,
            namespace: "dev",
            name: "N'to",
            metadata: { createdAt: "2025-05-19T03:27:16.292Z", createdById: 1, updatedAt: null, updatedById: null },
            songs: [
                {
                    id: 1,
                    albumId: 0,
                    artistId: 1,
                    namespace: "dev",
                    name: "Comite",
                    duration: 336,
                    tagIds: ["upbeat"],
                    metadata: {
                        createdAt: "2025-05-19T03:27:16.292Z",
                        createdById: 1,
                        updatedAt: "2025-05-19T03:33:16.292Z",
                        updatedById: 2,
                        createdBy: {
                            id: 1,
                            name: "Admin",
                            metadata: {
                                createdAt: "2025-05-19T03:27:16.292Z",
                                createdById: 1,
                                updatedAt: null,
                                updatedById: null,
                            },
                        },
                    },
                    tags: [{ id: "upbeat", name: "Upbeat" }],
                },
            ],
        });
    });

    it("should return entities matching the criteria", async () => {
        // arrange
        const users: User[] = [
            {
                id: 1,
                name: "Mara Mauzi",
                metadata: { createdById: 2, createdAt: new Date().toISOString(), updatedAt: null, updatedById: null },
            },
            {
                id: 2,
                name: "Susi Sonne",
                metadata: { createdById: 2, createdAt: new Date().toISOString(), updatedAt: null, updatedById: null },
            },
            {
                id: 3,
                name: "Dana Dandy",
                metadata: { createdById: 1, createdAt: new Date().toISOString(), updatedAt: null, updatedById: null },
            },
        ];

        const expected = users.slice(0, 2);
        repository.useEntities({ users });
        repository.useLoadAllUsers();

        // act
        const actual = await workspace
            .from(UserBlueprint)
            .where({ metadata: { createdById: 2 } })
            .get();

        // assert
        expect(actual).toStrictEqual(expected);
    });

    it.skip("should only return entities that are hydrated according to the selection", async () => {
        // [todo] ❌ this test is no longer valid as i've changed joinEntities() to provide a default value
        // (null in case of nullable, [] in case of array)
        // arrange
        const users: User[] = [
            {
                // we're expecting to only receive "Susi Sonne"
                id: 1,
                name: "Susi Sonne",
                metadata: {
                    createdById: 3,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    updatedById: 3,
                },
            },
            {
                id: 2,
                name: "Mara Mauzi",
                metadata: { createdById: 3, createdAt: new Date().toISOString(), updatedAt: null, updatedById: null },
            },
            {
                id: 3,
                name: "Dana Dandy",
                metadata: { createdById: 0, createdAt: new Date().toISOString(), updatedAt: null, updatedById: null },
            },
        ];

        const expected = users
            .slice(0, 1)
            .map(user => ({ ...user, metadata: { ...user.metadata, createdBy: users[2], updatedBy: users[2] } }));

        repository.useEntities({ users });
        repository.useLoadAllUsers();

        // act
        const actual = await workspace
            .from(UserBlueprint)
            .select({ metadata: { createdBy: true, updatedBy: true } })
            .cache(true)
            .get();

        // assert
        expect(actual).toStrictEqual(expected);
    });

    it("exact order and identity of entities returned by source is kept when querying by parameters", async () => {
        /**
         * arrange
         *
         * we set up three users: "Susi Sonne" and "Mara Mauzi" which will be returned by the request, where "Dana Dandy" will be hydrated
         * as the metadata.createdBy user. Because all are of type "User", they all end up in the same EntityStore during the first load call.
         * When we then request again (which will load from cache), we want to make sure that "Dana Dandy" is not suddenly part of the returned result,
         * it should still only exist as metadata.createdBy.user on "Susi Sonne" and "Mara Mauzi".
         *
         * Testing that the order being kept is done by having "Susi Sonne" be before "Mara Mauzi",
         * which is different to what the default sorter of "User" is set to as it orders names ascending.
         */
        const users: User[] = [
            {
                id: 1,
                name: "Susi Sonne",
                metadata: { createdById: 3, createdAt: new Date().toISOString(), updatedAt: null, updatedById: null },
            },
            {
                id: 2,
                name: "Mara Mauzi",
                metadata: { createdById: 3, createdAt: new Date().toISOString(), updatedAt: null, updatedById: null },
            },
            {
                id: 3,
                name: "Dana Dandy",
                metadata: { createdById: 0, createdAt: new Date().toISOString(), updatedAt: null, updatedById: null },
            },
        ];

        const expected = users
            .slice(0, 2)
            .map(user => ({ ...user, metadata: { ...user.metadata, createdBy: users[2] } }));

        const load = () =>
            workspace
                .from(UserBlueprint)
                .use(UserRequestBlueprint, { page: 0, pageSize: 2 })
                .select({ metadata: { createdBy: true } })
                .cache(true)
                .get();

        repository.useEntities({ users });
        repository.useLoadUsersByRequest();
        repository.useLoadUserById();

        // act
        const loadedFromSource = await load();
        const loadedFromCache = await load();

        // assert
        expect(loadedFromCache).toStrictEqual(expected);
        expect(loadedFromCache).toStrictEqual(loadedFromSource);
    });

    it("should hydrate provided entities", async () => {
        // arrange
        const users: User[] = [
            {
                id: 1,
                name: "Susi Sonne",
                metadata: { createdById: 2, createdAt: new Date().toISOString(), updatedAt: null, updatedById: null },
            },
            {
                id: 2,
                name: "Mara Mauzi",
                metadata: { createdById: 3, createdAt: new Date().toISOString(), updatedAt: null, updatedById: null },
            },
            {
                id: 3,
                name: "Dana Dandy",
                metadata: { createdById: 1, createdAt: new Date().toISOString(), updatedAt: null, updatedById: null },
            },
        ];

        const getUserById = (id: number) => {
            const user = users.find(user => user.id === id);

            if (!user) {
                throw new Error(`bad test data, did not find user by id ${id}`);
            }

            return structuredClone(user);
        };

        const expected = users.map(user => ({
            ...user,
            metadata: { ...user.metadata, createdBy: getUserById(user.metadata.createdById) },
        }));

        repository.useEntities({ users });
        repository.useLoadUserById();

        // act
        const actual = await workspace
            .for(UserBlueprint)
            .select({ metadata: { createdBy: true } })
            .hydrate(users);

        // assert
        expect(actual).toStrictEqual(expected);
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

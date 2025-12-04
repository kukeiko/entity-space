import { PackedEntitySelection, SelectEntity } from "@entity-space/elements";
import {
    Artist,
    ArtistBlueprint,
    Folder,
    FolderBlueprint,
    Song,
    SongBlueprint,
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
import { createMetadata, defaultEntities } from "./testing/default-entities";
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

    describe("[from archive] system supports", () => {
        let artists: Artist[];
        let songs: Song[];

        beforeEach(() => {
            artists = [
                {
                    id: 1,
                    name: "Infected Mushroom",
                    country: "Isreal",
                    namespace: "dev",
                    metadata: createMetadata(1),
                },
                {
                    id: 2,
                    name: "Hedflux",
                    country: "Scotland",
                    namespace: "dev",
                    metadata: createMetadata(1),
                },
                {
                    id: 3,
                    name: "Sunnexo",
                    country: "Netherlands",
                    namespace: "dev",
                    metadata: createMetadata(1),
                },
                {
                    id: 4,
                    name: "No Songs Artist",
                    country: "Lazyland",
                    namespace: "dev",
                    metadata: createMetadata(1),
                },
            ];

            songs = [
                // Infected Mushroom
                {
                    id: 10,
                    artistId: 1,
                    albumId: 100,
                    name: "Frog Machine",
                    duration: 370,
                    namespace: "dev",
                    metadata: createMetadata(1),
                },
                {
                    id: 11,
                    artistId: 1,
                    albumId: 200,
                    name: "Blue Swan 5",
                    duration: 538,
                    namespace: "dev",
                    metadata: createMetadata(1),
                },
                {
                    id: 12,
                    artistId: 1,
                    albumId: 300,
                    name: "Animatronica",
                    duration: 375,
                    namespace: "dev",
                    metadata: createMetadata(1),
                },
                // Hedflux
                {
                    id: 20,
                    artistId: 2,
                    albumId: 400,
                    name: "Sacralicious",
                    duration: 446,
                    namespace: "dev",
                    metadata: createMetadata(1),
                },
                // Sunnexo
            ];

            repository.useEntities({ artists, songs });
        });

        describe("finding one entity by id", () => {
            it("by loading from source", async () => {
                // arrange
                const expected = artists[0];
                const id = expected.id;
                const loadArtistById = repository.useLoadArtistById();

                // act
                const actual = await workspace.from(ArtistBlueprint).where({ id }).findOne();

                // assert
                expect(actual).toEqual(expected);
                expect(loadArtistById).toHaveBeenCalledTimes(1);
            });

            it("by loading from cache", async () => {
                // arrange
                const expected = artists[0];
                const id = expected.id;
                const loadArtistById = repository.useLoadArtistById();

                // act
                await workspace.from(ArtistBlueprint).where({ id }).cache(true).findOne(); // load into cache
                const actual = await workspace.from(ArtistBlueprint).where({ id }).cache(true).findOne(); // load from cache

                // assert
                expect(actual).toEqual(expected);
                expect(loadArtistById).toHaveBeenCalledTimes(1);
            });

            it("by loading from cache using the result of a superset query", async () => {
                // arrange
                const expected = artists[0];
                const id = expected.id;
                const loadArtistById = repository.useLoadArtistById();
                const ids = artists.map(artist => artist.id);

                // act
                // load into cache all the artists
                await workspace.from(ArtistBlueprint).where({ id: ids }).cache(true).get();
                // query the one artist we actually want
                const actual = await workspace.from(ArtistBlueprint).where({ id }).cache(true).findOne();

                // assert
                expect(actual).toEqual(expected);
                expect(loadArtistById).toHaveBeenCalledTimes(artists.length);
            });

            // [todo] ❌ cache invalidation currently not available like this
            it.skip("invalidating the cache", async () => {
                // // arrange
                // const expected = artists[0];
                // const id = expected.id;
                // const loadArtistById = addLoadArtistById();
                // // act
                // await workspace.from(ArtistBlueprint).where({ id }).cache(true).findOne(); // load into cache
                // workspace.invalidate(ArtistBlueprint, { where: { id } });
                // const actual = await workspace.from(ArtistBlueprint).where({ id }).cache(true).findOne();
                // // assert
                // expect(actual).toEqual(expected);
                // expect(loadArtistById).toHaveBeenCalledTimes(2);
            });

            // [todo] add "by loading from cache" tests
            describe("and hydration of", () => {
                describe("a relation", () => {
                    it("by loading from source", async () => {
                        // arrange
                        const song = songs[0];
                        const expected: SelectEntity<Song, { artist: true }> = {
                            ...song,
                            artist: artists.find(artist => artist.id === song.artistId)!,
                        };
                        const id = expected.id;
                        const loadSongById = repository.useLoadSongById();
                        const loadArtistById = repository.useLoadArtistById();

                        // act
                        const actual = await workspace
                            .from(SongBlueprint)
                            .where({ id })
                            .select({ artist: true })
                            .findOne();

                        // assert
                        expect(actual).toEqual(expected);
                        expect(loadSongById).toHaveBeenCalledTimes(1);
                        expect(loadArtistById).toHaveBeenCalledTimes(1);
                    });
                });

                describe("an array relation", () => {
                    it("by loading from source", async () => {
                        // arrange
                        const artist = artists[0];
                        const expected: SelectEntity<Artist, { songs: true }> = {
                            ...artist,
                            songs: songs
                                .filter(song => song.artistId === artist.id)
                                .sort((a, b) => a.name.localeCompare(b.name)),
                        };
                        const id = expected.id;
                        const loadArtistById = repository.useLoadArtistById();
                        const loadSongsByArtistId = repository.useLoadSongsByArtistId();

                        // act
                        const actual = await workspace
                            .from(ArtistBlueprint)
                            .where({ id })
                            .select({ songs: true })
                            .findOne();

                        // assert
                        expect(actual).toEqual(expected);
                        expect(loadArtistById).toHaveBeenCalledTimes(1);
                        expect(loadSongsByArtistId).toHaveBeenCalledTimes(1);
                    });
                });
            });

            it.only("and hydrating a primitive property using a custom hydrator", async () => {
                // arrange
                const artist = artists[0];
                const expected: SelectEntity<Artist, { title: true }> = {
                    ...artist,
                    title: repository.toArtistTitle(artist),
                };
                const id = expected.id;
                const loadArtistById = repository.useLoadArtistById();
                const hydrateArtistTitle = repository.useHydrateArtistTitle();

                // act
                const actual = await workspace.from(ArtistBlueprint).where({ id }).select({ title: true }).findOne();

                // assert
                expect(actual).toEqual(expected);
                expect(loadArtistById).toHaveBeenCalledTimes(1);
                expect(hydrateArtistTitle).toHaveBeenCalledTimes(1);
            });
        });

        describe("finding multiple entities by id", () => {
            describe("using a source that returns multiple artists by id", () => {
                it("by loading from source", async () => {
                    // arrange
                    const expected = artists.slice();
                    const id = expected.map(artist => artist.id);
                    const loadArtistsById = repository.useLoadArtistsByIds();

                    // act
                    const actual = await workspace.from(ArtistBlueprint).where({ id }).get();

                    // assert
                    expect(actual).toEqual(expected);
                    expect(loadArtistsById).toHaveBeenCalledTimes(1);
                });

                it("by loading from cache", async () => {
                    // arrange
                    const expected = artists.slice();
                    const id = expected.map(artist => artist.id);
                    const loadArtistsById = repository.useLoadArtistsByIds();

                    // act
                    await workspace.from(ArtistBlueprint).where({ id }).cache(true).get(); // load into cache
                    const actual = await workspace.from(ArtistBlueprint).where({ id }).cache(true).get();

                    // assert
                    expect(actual).toEqual(expected);
                    expect(loadArtistsById).toHaveBeenCalledTimes(1);
                });

                it("by partially loading from cache", async () => {
                    // arrange
                    const expected = artists.slice();
                    const loadIntoCacheId = artists[0].id;
                    const id = expected.map(artist => artist.id);
                    const expectedLoadFromSourceIds = id.filter(id => id !== loadIntoCacheId);
                    const loadArtistsById = repository.useLoadArtistsByIds();

                    // act
                    await workspace.from(ArtistBlueprint).where({ id: loadIntoCacheId }).cache(true).get();
                    const actual = await workspace.from(ArtistBlueprint).where({ id }).cache(true).get();

                    // assert
                    expect(actual).toEqual(expected);
                    expect(loadArtistsById).toHaveBeenCalledTimes(2);
                    expect(loadArtistsById).toHaveBeenNthCalledWith(1, [loadIntoCacheId]);
                    expect(loadArtistsById).toHaveBeenNthCalledWith(2, expectedLoadFromSourceIds);
                });

                // [todo] ❌ cache invalidation currently not available like this
                it.skip("invalidating the cache", async () => {
                    //     // arrange
                    //     const expected = artists.slice();
                    //     const id = expected.map(artist => artist.id);
                    //     const loadArtistsById = addLoadArtistsById();
                    //     // act
                    //     await workspace.from(ArtistBlueprint).where({ id }).getAll(); // load into cache
                    //     workspace.invalidate(ArtistBlueprint, { where: { id } });
                    //     const actual = await workspace.from(ArtistBlueprint).where({ id }).getAll();
                    //     // assert
                    //     expect(actual).toEqual(expected);
                    //     expect(loadArtistsById).toHaveBeenCalledTimes(2);
                });
            });

            describe("using a source that returns one artist by id", () => {
                it("by loading from source", async () => {
                    // arrange
                    const expected = artists.slice();
                    const id = expected.map(artist => artist.id);
                    const loadArtistById = repository.useLoadArtistById();

                    // act
                    const actual = await workspace.from(ArtistBlueprint).where({ id }).get();

                    // assert
                    expect(actual).toEqual(expected);
                    expect(loadArtistById).toHaveBeenCalledTimes(id.length);
                });

                it("by loading from cache", async () => {
                    // arrange
                    const expected = artists.slice();
                    const id = expected.map(artist => artist.id);
                    const loadArtistById = repository.useLoadArtistById();

                    // act
                    await workspace.from(ArtistBlueprint).where({ id }).cache(true).get(); // load into cache
                    const actual = await workspace.from(ArtistBlueprint).where({ id }).cache(true).get();

                    // assert
                    expect(actual).toEqual(expected);
                    expect(loadArtistById).toHaveBeenCalledTimes(id.length);
                });
            });
        });

        // [todo] ❌ "or" has been disabled during porting to reduce scope
        it("combining different sources to resolve a query", async () => {
            // // arrange
            // const expected = [songs[0], songs[1]];
            // const id = expected[0].id;
            // const name = expected[1].name;
            // const loadSongById = repository.useLoadSongById();
            // const loadSongByName = repository.useLoadSongByName();
            // // act
            // const actual = await workspace
            //     .from(SongBlueprint)
            //     .where({ $or: [{ id }, { name }] })
            //     .get();
            // // assert
            // expect(actual).toEqual(expected);
            // expect(loadSongById).toHaveBeenCalledTimes(1);
            // expect(loadSongByName).toHaveBeenCalledTimes(1);
        });

        // [todo] ❌ cache invalidation currently not available like this
        it.skip("invalidating the cache by ids", async () => {
            //     // arrange
            //     const expected = artists.slice();
            //     const id = expected.map(artist => artist.id);
            //     const invalidatedIds = id.filter((_, index) => index % 2 == 0);
            //     const loadArtistsById = addLoadArtistsById();
            //     // act
            //     await workspace.from(ArtistBlueprint).where({ id }).cache(true).getAll(); // load into cache
            //     workspace.invalidate(ArtistBlueprint, { where: { id: invalidatedIds } });
            //     const actual = await workspace.from(ArtistBlueprint).where({ id }).cache(true).getAll();
            //     // assert
            //     expect(actual).toEqual(expected);
            //     expect(loadArtistsById).toHaveBeenCalledTimes(2);
            //     expect(loadArtistsById).toHaveBeenNthCalledWith(1, id);
            //     expect(loadArtistsById).toHaveBeenNthCalledWith(2, invalidatedIds);
        });

        it("having a custom hydrator depend on the auto hydrator", async () => {
            // arrange
            const artist = artists[0];
            const expected: SelectEntity<Artist, { longestSong: true; songs: true }> = {
                ...artist,
                // [todo] ❓ we cannot just use "findLongestSong()" as the Select removes "undefined", meaning that we expect a hydrated property
                // to never be able to be undefined. That is fine if we enforce the user to use "null" instead, but that has some DX implications.
                longestSong: repository.getLongestSong(songs.filter(song => song.artistId === artist.id)),
                songs: songs.filter(song => song.artistId === artist.id).sort((a, b) => a.name.localeCompare(b.name)),
            };
            const id = expected.id;
            const loadArtistById = repository.useLoadArtistById();
            const loadSongsByArtistId = repository.useLoadSongsByArtistId();
            const hydrateArtistLongestSong = repository.addHydrateArtistLongestSong();

            // act
            const actual = await workspace
                .from(ArtistBlueprint)
                .where({ id })
                .select({ songs: true, longestSong: true })
                .findOne();

            // assert
            expect(actual).toEqual(expected);
            expect(loadArtistById).toHaveBeenCalledTimes(1);
            expect(loadSongsByArtistId).toHaveBeenCalledTimes(1);
            expect(hydrateArtistLongestSong).toHaveBeenCalledTimes(1);
        });
    });
});

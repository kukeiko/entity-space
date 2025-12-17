import { Artist, ArtistBlueprint, Song, SongTag, Tag, User, UserBlueprint } from "@entity-space/elements/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { EntityWorkspace } from "../../entity-workspace";
import { TestFacade, TestRepository } from "../../testing";

describe("get()", () => {
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

    it("should work (complex)", async () => {
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
                metadata: {
                    createdAt: "2025-05-19T03:27:16.292Z",
                    createdById: 1,
                    updatedAt: "2025-05-19T03:33:16.292Z",
                    updatedById: 2,
                },
            },
        ];

        const songTags: SongTag[] = [{ songId: 1, tagId: "upbeat" }];

        repository.useEntities({ artists, songs, tags, users, songTags });
        repository.useLoadArtistById();
        repository.useLoadSongsByArtistId();
        repository.useHydrateSongTagIds();
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
});

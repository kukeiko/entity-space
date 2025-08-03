import { cloneEntity } from "@entity-space/elements";
import {
    Artist,
    ArtistBlueprint,
    Song,
    Tag,
    User,
    UserBlueprint,
    UserRequestBlueprint,
} from "@entity-space/elements/testing";
import { describe } from "node:test";
import { beforeEach, expect, it } from "vitest";
import { EntityWorkspace } from "./entity-workspace";
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

    it("should work", async () => {
        /**
         * This test is a temporary one to actively check lots of features to reduce change of breaking something while developing.
         * It should be split into smaller ones at some point.
         */
        // arrange
        const users: User[] = [
            { id: 1, name: "Admin", metadata: { createdAt: "2025-05-19T03:27:16.292Z", createdById: 1 } },
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
                metadata: { createdAt: "2025-05-19T03:27:16.292Z", createdById: 1 },
            },
            {
                id: 2,
                namespace: "prod",
                name: "So Below",
                metadata: { createdAt: "2025-05-19T03:27:16.292Z", createdById: 1 },
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
                    // [todo] tagIds is optional, so we have to add it. should be removed once hydrators can specify which properties
                    // need to be hydrated in order for them to hydrate a relation. also, EntitySource has to explicitly specify that
                    // it includes tagIds - that is a source of confusion, either not require it or warn the user that entities returned
                    // include it without the source specifying that it does.
                    tagIds: true,
                    tags: true,
                    metadata: {
                        // [todo] use "updatedBy: true" once setting unhydrated values to null works (because it could not find the updatedBy user)
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
            metadata: { createdAt: "2025-05-19T03:27:16.292Z", createdById: 1 },
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
                            metadata: { createdAt: "2025-05-19T03:27:16.292Z", createdById: 1 },
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
            { id: 1, name: "Mara Mauzi", metadata: { createdById: 2, createdAt: new Date().toISOString() } },
            { id: 2, name: "Susi Sonne", metadata: { createdById: 2, createdAt: new Date().toISOString() } },
            { id: 3, name: "Dana Dandy", metadata: { createdById: 1, createdAt: new Date().toISOString() } },
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

    it("should only return entities that are hydrated according to the selection", async () => {
        // arrange
        const users: User[] = [
            {
                id: 1,
                name: "Susi Sonne",
                metadata: { createdById: 3, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
            },
            { id: 2, name: "Mara Mauzi", metadata: { createdById: 3, createdAt: new Date().toISOString() } },
            { id: 3, name: "Dana Dandy", metadata: { createdById: 0, createdAt: new Date().toISOString() } },
        ];

        const expected = users
            .slice(0, 1)
            .map(user => ({ ...user, metadata: { ...user.metadata, createdBy: users[2] } }));

        repository.useEntities({ users });
        repository.useLoadAllUsers();

        // act
        const actual = await workspace
            .from(UserBlueprint)
            .select({ metadata: { createdBy: true, updatedAt: true } })
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
            { id: 1, name: "Susi Sonne", metadata: { createdById: 3, createdAt: new Date().toISOString() } },
            { id: 2, name: "Mara Mauzi", metadata: { createdById: 3, createdAt: new Date().toISOString() } },
            { id: 3, name: "Dana Dandy", metadata: { createdById: 0, createdAt: new Date().toISOString() } },
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
            { id: 1, name: "Susi Sonne", metadata: { createdById: 2, createdAt: new Date().toISOString() } },
            { id: 2, name: "Mara Mauzi", metadata: { createdById: 3, createdAt: new Date().toISOString() } },
            { id: 3, name: "Dana Dandy", metadata: { createdById: 1, createdAt: new Date().toISOString() } },
        ];

        const getUserById = (id: number) => {
            const user = users.find(user => user.id === id);

            if (!user) {
                throw new Error(`bad test data, did not find user by id ${id}`);
            }

            return cloneEntity(user);
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
});

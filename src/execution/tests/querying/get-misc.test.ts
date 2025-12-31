import {
    Artist,
    ArtistBlueprint,
    Song,
    SongBlueprint,
    SongTag,
    Tag,
    User,
    UserBlueprint,
} from "@entity-space/elements/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EntityWorkspace } from "../../entity-workspace";
import { TestFacade, TestRepository } from "../../testing";
import { createMetadata } from "../../testing/create-metadata.fn";

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

        repository.useCommon().useEntities({ users });
        repository.useCommon().useLoadUserById();

        // act
        const loadedFromSource = await load();

        // assert
        expect(loadedFromSource).toStrictEqual(expected);
    });

    it("should only return entities that are hydrated according to the selection", async () => {
        // arrange
        const defaultArtist = workspace.from(ArtistBlueprint).constructDefault();
        const defaultSong = workspace.from(SongBlueprint).constructDefault();

        const artists: Artist[] = [
            { ...defaultArtist, id: 1, namespace: "dev" },
            { ...defaultArtist, id: 2, namespace: "dev" },
        ];
        const longestSong = { ...defaultSong, artistId: artists[0].id, namespace: artists[0].namespace };

        const expected: Artist[] = [
            {
                ...artists[0],
                longestSong: { ...longestSong },
            },
        ];

        const loadArtists = vi.fn(() => artists);

        facade
            .getServices()
            .for(ArtistBlueprint)
            .addSource({ load: loadArtists })
            .addHydrator({
                requires: { id: true },
                select: { longestSong: true },
                hydrate: ({ entities }) => {
                    for (const artist of entities) {
                        if (artist.id === 1) {
                            artist.longestSong = structuredClone(longestSong);
                        }
                    }
                },
            });

        // act
        const actual = await workspace.from(ArtistBlueprint).select({ longestSong: true }).get();

        // assert
        expect(actual).toStrictEqual(expected);
    });

    it("should return entities matching the criteria", async () => {
        // arrange
        const users: User[] = [
            {
                id: 1,
                name: "Mara Mauzi",
                metadata: createMetadata(2),
            },
            {
                id: 2,
                name: "Susi Sonne",
                metadata: createMetadata(2),
            },
            {
                id: 3,
                name: "Dana Dandy",
                metadata: createMetadata(1),
            },
        ];

        const expected = users.slice(0, 2);
        repository.useCommon().useEntities({ users });
        repository.useCommon().useLoadAllUsers();

        // act
        const actual = await workspace
            .from(UserBlueprint)
            .where({ metadata: { createdById: 2 } })
            .get();

        // assert
        expect(actual).toStrictEqual(expected);
    });

    it("should work (complex)", async () => {
        // arrange
        const createdAt = "2025-05-19T03:27:16.292Z";
        const updatedAt = "2025-05-19T03:33:16.292Z";

        const users: User[] = [
            {
                id: 1,
                name: "Admin",
                metadata: createMetadata(1, undefined, createdAt),
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
                metadata: createMetadata(1, undefined, createdAt),
            },
            {
                id: 2,
                namespace: "prod",
                name: "So Below",
                metadata: createMetadata(1, undefined, createdAt),
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
                metadata: createMetadata(1, 2, createdAt, updatedAt),
            },
        ];

        const songTags: SongTag[] = [{ songId: 1, tagId: "upbeat" }];

        repository.useCommon().useEntities({ users });
        repository.useCommon().useLoadUserById();
        repository.useMusic().useEntities({ artists, songs, tags, songTags });
        repository.useMusic().useLoadArtistById();
        repository.useMusic().useLoadSongsByArtistId();
        repository.useMusic().useHydrateSongTagIds();
        repository.useMusic().useLoadTagById();

        // act
        const artist = await workspace
            .from(ArtistBlueprint)
            .select({
                metadata: true,
                songs: {
                    tags: true,
                    metadata: {
                        createdBy: true,
                        updatedBy: true,
                    },
                },
            })
            .where({ id: [1] })
            .getOne();

        // assert
        expect(artist).toEqual({
            id: 1,
            namespace: "dev",
            name: "N'to",
            metadata: { createdAt, createdById: 1, updatedAt: null, updatedById: null },
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
                        createdAt,
                        createdById: 1,
                        updatedAt,
                        updatedById: 2,
                        createdBy: {
                            id: 1,
                            name: "Admin",
                            metadata: {
                                createdAt,
                                createdById: 1,
                                updatedAt: null,
                                updatedById: null,
                            },
                        },
                        updatedBy: null,
                    },
                    tags: [{ id: "upbeat", name: "Upbeat" }],
                },
            ],
        });
    });
});

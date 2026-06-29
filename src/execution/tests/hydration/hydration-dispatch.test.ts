import { SelectEntity } from "@entity-space/elements";
import { Artist, ArtistBlueprint, SongBlueprint, TagBlueprint } from "@entity-space/elements/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EntityWorkspace } from "../../entity-workspace";
import { TestFacade, TestRepository } from "../../testing";
import { createMetadata } from "../../testing/create-metadata.fn";

describe("hydration dispatch", () => {
    let facade: TestFacade;
    let repository: TestRepository;
    let workspace: EntityWorkspace;

    beforeEach(() => {
        facade = new TestFacade();
        repository = facade.getTestRepository();
        workspace = facade.getWorkspace();
    });

    it("user hydrators have higher piority than the auto join hydrator", async () => {
        // arrange
        const hydrate = vi.fn(() => undefined);

        repository.useMusic().useLoadAllArtists();
        repository.useMusic().useLoadSongsByArtistId();

        facade
            .getServices()
            .for(ArtistBlueprint)
            .addHydrator({
                requires: { id: true },
                select: { songs: true },
                hydrate,
            });

        // act
        await workspace.from(ArtistBlueprint).select({ songs: true }).get();

        // assert
        expect(hydrate).toHaveBeenCalledTimes(1);
    });

    it("having a custom hydrator depend on the auto hydrator", async () => {
        // arrange
        const artist = {
            id: 1,
            name: "Infected Mushroom",
            country: "Isreal",
            namespace: "dev",
            metadata: createMetadata(1),
        };

        const songs = [
            // Infected Mushroom
            workspace.from(SongBlueprint).construct({
                id: 10,
                artistId: 1,
                albumId: 100,
                name: "Frog Machine",
                duration: 370,
                namespace: "dev",
                metadata: createMetadata(1),
            }),
            workspace.from(SongBlueprint).construct({
                id: 11,
                artistId: 1,
                albumId: 200,
                name: "Blue Swan 5",
                duration: 538,
                namespace: "dev",
                metadata: createMetadata(1),
            }),
            workspace.from(SongBlueprint).construct({
                id: 12,
                artistId: 1,
                albumId: 300,
                name: "Animatronica",
                duration: 375,
                namespace: "dev",
                metadata: createMetadata(1),
            }),
        ];

        repository.useMusic().useEntities({ artists: [artist], songs });

        const expected: SelectEntity<Artist, { longestSong: true; songs: true }> = {
            ...artist,
            // [todo] ❓ we cannot just use "findLongestSong()" as the Select removes "undefined", meaning that we expect a hydrated property
            // to never be able to be undefined. That is fine if we enforce the user to use "null" instead, but that has some DX implications.
            longestSong: repository.useMusic().getLongestSong(songs.filter(song => song.artistId === artist.id)),
            songs: songs.filter(song => song.artistId === artist.id).sort((a, b) => a.name.localeCompare(b.name)),
        };
        const id = expected.id;
        const loadArtistById = repository.useMusic().useLoadArtistById();
        const loadSongsByArtistId = repository.useMusic().useLoadSongsByArtistId();
        const hydrateArtistLongestSong = repository.useMusic().useHydrateArtistLongestSong();

        // act
        const actual = await workspace
            .from(ArtistBlueprint)
            .where({ id })
            .select({ country: true, songs: true, longestSong: true })
            .findOne();

        // assert
        expect(actual).toEqual(expected);
        expect(loadArtistById).toHaveBeenCalledTimes(1);
        expect(loadSongsByArtistId).toHaveBeenCalledTimes(1);
        expect(hydrateArtistLongestSong).toHaveBeenCalledTimes(1);
    });

    it("having a custom hydrator depend on the auto hydrator (deep relation)", async () => {
        // arrange
        const artist = {
            id: 1,
            name: "Infected Mushroom",
            country: "Isreal",
            namespace: "dev",
            metadata: createMetadata(1),
        };

        const songs = [
            // Infected Mushroom
            workspace.from(SongBlueprint).construct({
                id: 10,
                artistId: 1,
                albumId: 100,
                name: "Frog Machine",
                duration: 370,
                namespace: "dev",
                metadata: createMetadata(1),
            }),
            workspace.from(SongBlueprint).construct({
                id: 11,
                artistId: 1,
                albumId: 200,
                name: "Blue Swan 5",
                duration: 538,
                namespace: "dev",
                metadata: createMetadata(1),
            }),
            workspace.from(SongBlueprint).construct({
                id: 12,
                artistId: 1,
                albumId: 300,
                name: "Animatronica",
                duration: 375,
                namespace: "dev",
                metadata: createMetadata(1),
            }),
        ];

        const tags = [workspace.from(TagBlueprint).construct({ id: "upbeat", name: "Upbeat" })];
        const songTags = [{ songId: 10, tagId: "upbeat" }];

        const expected: SelectEntity<Artist, { songTags: true }> = {
            ...artist,
            songTags: [],
            songs: songs
                .filter(song => song.artistId === artist.id)
                .sort((a, b) => a.name.localeCompare(b.name))
                .map(song => {
                    const tagIds = songTags.filter(songTag => songTag.songId === song.id).map(songTag => songTag.tagId);
                    const thisTags = tags.filter(tag => tagIds.includes(tag.id));

                    return { ...song, tagIds, tags: thisTags };
                }),
        };

        repository.useMusic().useEntities({ artists: [artist], songs, songTags, tags });

        const songTagIds = Array.from(new Set(expected.songs?.flatMap(song => song.tagIds ?? []) ?? []));
        expected.songTags = tags.filter(tag => songTagIds.includes(tag.id));
        const id = expected.id;
        const loadArtistById = repository.useMusic().useLoadArtistById();
        const loadSongsByArtistId = repository.useMusic().useLoadSongsByArtistId();
        repository.useMusic().useLoadTagById();
        repository.useMusic().useHydrateSongTagIds();
        repository.useMusic().useHydrateArtistSongTags();

        // act
        const actual = await workspace
            .from(ArtistBlueprint)
            .where({ id })
            .select({ country: true, songTags: true })
            .findOne();

        // assert
        expect(actual).toEqual(expected);
        expect(loadArtistById).toHaveBeenCalledTimes(1);
        expect(loadSongsByArtistId).toHaveBeenCalledTimes(1);
    });
});

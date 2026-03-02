import { Artist, ArtistBlueprint, Song, SongBlueprint } from "@entity-space/elements/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { EntityWorkspace } from "../../entity-workspace";
import { CreateEntityFn } from "../../mutation/entity-mutation-function.type";
import { TestFacade, TestRepository } from "../../testing";
import { createMetadata } from "../../testing/create-metadata.fn";

describe("mutate duplicates", () => {
    let facade: TestFacade;
    let repository: TestRepository;
    let workspace: EntityWorkspace;

    beforeEach(() => {
        facade = new TestFacade();
        repository = facade.getTestRepository();
        workspace = facade.getWorkspace();
    });

    it("delete() does not delete the same entity twice", async () => {
        // arrange
        const artists: Artist[] = [
            {
                ...facade.constructDefault(ArtistBlueprint),
                id: 1,
                namespace: "dev",
            },
            {
                ...facade.constructDefault(ArtistBlueprint),
                id: 1,
                namespace: "dev",
            },
        ];

        const deleteArtist = repository.useMusic().useDeleteArtist();

        // act
        await workspace.in(ArtistBlueprint).delete(artists);

        // assert
        expect(deleteArtist).toHaveBeenCalledTimes(1);
    });

    it("save() does not create the same entity twice", async () => {
        // arrange
        const metadata = createMetadata(1);

        const artist: Artist = {
            ...facade.constructDefault(ArtistBlueprint),
            metadata,
            name: "foo",
            namespace: "dev",
        };

        const songA: Song = {
            ...facade.constructDefault(SongBlueprint),
            artist,
            metadata,
            namespace: "dev",
        };

        const songB: Song = {
            ...facade.constructDefault(SongBlueprint),
            albumId: 1,
            artist,
            metadata,
            namespace: "dev",
        };

        const songs: Song[] = [{ ...songA }, { ...songB }];

        const expectedArtist: Artist = {
            id: 1,
            metadata,
            name: "foo",
            namespace: "dev",
        };

        const dispatchedSongA: Song = {
            ...songA,
            artistId: 1,
            artist: undefined,
        };

        const dispatchedSongB: Song = {
            ...songB,
            artistId: 1,
            artist: undefined,
        };

        const expected: Song[] = [
            {
                ...dispatchedSongA,
                id: 1,
                artist: expectedArtist,
            },
            {
                ...dispatchedSongB,
                id: 2,
                artist: expectedArtist,
            },
        ];

        const createSong = repository.useMusic().useCreateSong();
        const createArtist = repository.useMusic().useCreateArtist();

        // act
        const actual = await workspace.in(SongBlueprint).select({ artist: true }).save(songs);

        // assert
        expect(actual).toEqual(expected);
        expect(actual[0].artist).toBe(actual[1].artist);
        expect(createSong).toHaveBeenCalledAfter(createArtist);
        expect(createSong).toHaveBeenCalledTimes(2);
        expect(createArtist).toHaveBeenCalledTimes(1);
        expect(createSong).toHaveBeenCalledWith<Parameters<CreateEntityFn<SongBlueprint>>>({
            selection: {},
            entity: { ...dispatchedSongA },
        });
        expect(createSong).toHaveBeenCalledWith<Parameters<CreateEntityFn<SongBlueprint>>>({
            selection: {},
            entity: { ...dispatchedSongB },
        });
    });

    describe("save() does not update the same entity twice", () => {
        it("without previous entities", async () => {
            // arrange
            const metadata = createMetadata(1);

            const artist: Artist = {
                ...facade.constructDefault(ArtistBlueprint),
                id: 1,
                metadata,
                namespace: "dev",
            };

            const songs: Song[] = [
                {
                    ...facade.constructDefault(SongBlueprint),
                    id: 1,
                    artistId: 1,
                    artist,
                    metadata,
                    namespace: "dev",
                },
                {
                    ...facade.constructDefault(SongBlueprint),
                    id: 2,
                    artistId: 1,
                    artist,
                    metadata,
                    namespace: "dev",
                },
            ];

            const updateSong = repository.useMusic().useUpdateSong();
            const updateArtist = repository.useMusic().useUpdateArtist();

            // act
            await workspace.in(SongBlueprint).select({ artist: true }).save(songs);

            // assert
            expect(updateSong).toHaveBeenCalledAfter(updateArtist);
            expect(updateSong).toHaveBeenCalledTimes(2);
            expect(updateArtist).toHaveBeenCalledTimes(1);
        });

        it("with previous entities", async () => {
            // arrange
            const metadata = createMetadata(1);

            const artist: Artist = {
                ...facade.constructDefault(ArtistBlueprint),
                id: 1,
                metadata,
                namespace: "dev",
            };

            const songs: Song[] = [
                {
                    ...facade.constructDefault(SongBlueprint),
                    id: 1,
                    artistId: 1,
                    artist,
                    metadata,
                    namespace: "dev",
                },
                {
                    ...facade.constructDefault(SongBlueprint),
                    id: 2,
                    artistId: 1,
                    artist,
                    metadata,
                    namespace: "dev",
                },
            ];

            const updatedArtist = structuredClone(artist);
            const updatedSongs = structuredClone(songs);

            updatedArtist.name = "updated";

            for (const song of updatedSongs) {
                song.artist = updatedArtist;
                song.name = "updated";
            }

            const updateSong = repository.useMusic().useUpdateSong();
            const updateArtist = repository.useMusic().useUpdateArtist();

            // act
            await workspace.in(SongBlueprint).select({ artist: true }).save(updatedSongs, songs);

            // assert
            expect(updateSong).toHaveBeenCalledAfter(updateArtist);
            expect(updateSong).toHaveBeenCalledTimes(2);
            expect(updateArtist).toHaveBeenCalledTimes(1);
        });
    });
});

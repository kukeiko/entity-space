import { EntityBlueprint } from "@entity-space/elements";
import {
    Album,
    AlbumBlueprint,
    Artist,
    ArtistBlueprint,
    ArtistRequest,
    ArtistRequestBlueprint,
    RecordMetadata,
    Song,
    SongBlueprint,
    SongTag,
    SongTagBlueprint,
    Tag,
    TagBlueprint,
} from "@entity-space/elements/testing";
import { jsonClone } from "@entity-space/utils";
import { uniqBy } from "lodash";
import { vi } from "vitest";
import { EntityServiceContainer } from "../../entity-service-container";
import { CreateEntityFn, DeleteEntityFn, UpdateEntityFn } from "../../mutation/entity-mutation-function.type";
import { InMemoryRepository } from "./in-memory-repository";

type MusicEntities = {
    artists: Artist[];
    albums: Album[];
    songs: Song[];
    songTags: SongTag[];
    tags: Tag[];
};

function filterById<T extends { id: string | number }>(id: string | number): (entity: T) => boolean {
    return entity => entity.id === id;
}

function filterByIds<T extends { id: string | number }>(ids: (string | number)[]): (entity: T) => boolean {
    return entity => ids.includes(entity.id);
}

function filterByMetadataDates<T extends { metadata: RecordMetadata }>(
    createdAt?: [string | undefined | null, string | undefined | null],
    updatedAt?: [string | undefined | null, string | undefined | null],
): (entity: T) => boolean {
    const matchesCreatedAt =
        createdAt === undefined
            ? () => true
            : (entity: T) => {
                  return (
                      (createdAt[0] ? entity.metadata.createdAt >= createdAt[0] : true) &&
                      (createdAt[1] ? entity.metadata.createdAt <= createdAt[1] : true)
                  );
              };

    const matchesUpdatedAt =
        updatedAt === undefined
            ? () => true
            : (entity: T) => {
                  return (
                      (updatedAt[0] && entity.metadata.updatedAt ? entity.metadata.updatedAt >= updatedAt[0] : true) &&
                      (updatedAt[1] && entity.metadata.updatedAt ? entity.metadata.updatedAt <= updatedAt[1] : true)
                  );
              };

    return entity => matchesCreatedAt(entity) && matchesUpdatedAt(entity);
}

export class MusicRepository extends InMemoryRepository<MusicEntities, "tags" | "songTags"> {
    constructor(services: EntityServiceContainer) {
        super();
        this.#services = services;
    }

    readonly #services: EntityServiceContainer;

    useLoadTagById() {
        const load = vi.fn((id: string) => this.filter("tags", filterById(id)));

        this.#services.for(TagBlueprint).addSource({
            where: { id: { $equals: true } },
            load: ({ criteria: { id } }) => load(id.value),
        });

        return load;
    }

    useLoadArtistsByRequest() {
        const load = vi.fn((parameters: ArtistRequest) => {
            const page = parameters.page ?? 0;
            const pageSize = parameters.pageSize ?? 3;
            const sliceFrom = pageSize * page;
            const sliceTo = pageSize * (page + 1);

            return jsonClone(this.filter("artists").slice(sliceFrom, sliceTo));
        });

        this.#services.for(ArtistBlueprint).addSource({
            parameters: ArtistRequestBlueprint,
            load: ({ parameters }) => load(parameters),
        });

        return load;
    }

    useLoadArtistsByCreatedAt() {
        const load = vi.fn(
            (
                createdAt?: [string | undefined | null, string | undefined | null],
                updatedAt?: [string | undefined | null, string | undefined | null],
            ) => this.filter("artists", filterByMetadataDates(createdAt, updatedAt)),
        );

        this.#services.for(ArtistBlueprint).addSource({
            where: {
                metadata: { createdAt: { $inRange: true }, updatedAt: { $inRange: true, $optional: true } },
            },
            load: ({
                criteria: {
                    metadata: { createdAt, updatedAt },
                },
            }) => {
                // [todo] ❌ bug: elvis not required if we make RecordMetadata.updatedAt optional
                return load(createdAt.value, updatedAt?.value);
            },
        });

        return load;
    }

    useLoadArtistById() {
        const load = vi.fn((id: number) => this.filter("artists", filterById(id)));

        this.#services.for(ArtistBlueprint).addSource({
            select: { country: true },
            where: { id: { $equals: true } },
            load: ({ criteria: { id }, selection }) => {
                return load(id.value).map(artist => {
                    if (!selection.country) {
                        delete artist.country;
                    }

                    return artist;
                });
            },
        });

        return load;
    }

    useLoadArtistsByIds() {
        const loadArtistsById = vi.fn((ids: number[]) => this.filter("artists", filterByIds(ids)));

        this.#services.for(ArtistBlueprint).addSource({
            where: { id: { $inArray: true } },
            load: ({ criteria: { id } }) => loadArtistsById(id.value),
        });

        return loadArtistsById;
    }

    useLoadArtistsByCountry() {
        const load = vi.fn((country?: string | null) => this.filter("artists", artist => artist.country === country));

        this.#services.for(ArtistBlueprint).addSource({
            where: { country: { $equals: true } },
            load: ({ criteria: { country } }) => load(country.value),
        });

        return load;
    }

    toArtistTitle(artist: Artist): string {
        return `${artist.name} (${artist.country})`;
    }

    findLongestSong(songs: Song[]): Song | undefined {
        return (songs ?? []).slice().sort((a, b) => b.duration - a.duration)[0];
    }

    getLongestSong(songs: Song[]): Song {
        const longestSong = this.findLongestSong(songs);

        if (!longestSong) {
            throw new Error("no longest song found");
        }

        return longestSong;
    }

    useHydrateArtistTitle() {
        const hydrate = vi.fn((artists: Artist[]) => {
            artists.forEach(entity => (entity.title = this.toArtistTitle(entity)));
        });

        this.#services.for(ArtistBlueprint).addHydrator({
            requires: { name: true, country: true },
            select: { title: true },
            hydrate,
        });

        return hydrate;
    }

    useHydrateArtistLongestSong() {
        const hydrate = vi.fn((artists: Artist[]) => {
            artists.forEach(artist => (artist.longestSong = this.findLongestSong(artist.songs ?? [])));
        });

        this.#services.for(ArtistBlueprint).addHydrator({
            requires: { songs: { duration: true } },
            select: { longestSong: true },
            hydrate,
        });

        return hydrate;
    }

    useHydrateArtistSongTags() {
        this.#services.for(ArtistBlueprint).addHydrator({
            select: { songTags: true },
            requires: { songs: { tags: true } },
            hydrate: entities => {
                for (const entity of entities) {
                    entity.songTags = uniqBy(
                        entity.songs.flatMap(song => song.tags),
                        entity => entity.id,
                    );
                }
            },
        });
    }

    useCreateArtist() {
        const create = vi.fn<CreateEntityFn<ArtistBlueprint>>(({ entity: artist }) => {
            const nextId = this.nextId("artists");

            const created: EntityBlueprint.Instance<ArtistBlueprint> = {
                id: nextId,
                namespace: artist.namespace,
                metadata: { createdAt: new Date().toISOString(), createdById: 1, updatedAt: null, updatedById: null },
                name: artist.name,
            };

            this.entities.artists = [...(this.entities.artists ?? []), created];

            return Promise.resolve(created);
        });

        this.#services.for(ArtistBlueprint).addCreateOneMutator({ create });

        return create;
    }

    useUpdateArtist() {
        const update = vi.fn<UpdateEntityFn<ArtistBlueprint>>(({ entity }) => {
            // [todo] ❌ type assertion
            return structuredClone(entity) as Artist;
        });

        this.#services.for(ArtistBlueprint).addUpdateOneMutator({ update });

        return update;
    }

    useDeleteArtist() {
        const del = vi.fn<DeleteEntityFn<ArtistBlueprint>>(() => {});

        this.#services.for(ArtistBlueprint).addDeleteOneMutator({
            delete: del,
        });

        return del;
    }

    useLoadAlbumById() {
        const load = vi.fn((id: number) => this.filter("albums", filterById(id)));

        this.#services.for(AlbumBlueprint).addSource({
            where: { id: { $equals: true } },
            load: ({ criteria: { id } }) => load(id.value),
        });

        return load;
    }

    useLoadSongById() {
        const load = vi.fn((id: number) => this.filter("songs", filterById(id)));

        this.#services.for(SongBlueprint).addSource({
            where: { id: { $equals: true } },
            load: ({ criteria: { id } }) => load(id.value),
        });

        return load;
    }

    useLoadSongByName() {
        const load = vi.fn((name: string) => this.filter("songs", song => song.name === name));

        this.#services.for(SongBlueprint).addSource({
            where: { name: { $equals: true } },
            load: ({ criteria: { name } }) => load(name.value),
        });

        return load;
    }

    useLoadSongsByArtistId() {
        const loadSongsByArtistId = vi.fn((artistIds: number[]) =>
            this.filter("songs", song => artistIds.includes(song.artistId)),
        );

        this.#services.for(SongBlueprint).addSource({
            where: { artistId: { $inArray: true } },
            load: ({ criteria: { artistId } }) => loadSongsByArtistId(artistId.value),
        });

        return loadSongsByArtistId;
    }

    useHydrateSongTagIds() {
        const hydrate = vi.fn((songs: Song[]) => {
            {
                songs.forEach(
                    song =>
                        (song.tagIds = this.filter("songTags", songTag => songTag.songId === song.id).map(
                            songTag => songTag.tagId,
                        )),
                );
            }
        });

        this.#services.for(SongBlueprint).addHydrator({
            select: { tagIds: true },
            requires: { id: true },
            hydrate,
        });

        return hydrate;
    }

    useLoadSongsByArtistIdAndNamespace() {
        const loadSongsByArtistIdsAndNamespace = vi.fn((artistIds: number[], namespace: string) =>
            this.filter("songs", song => song.namespace === namespace && artistIds.includes(song.artistId)),
        );

        this.#services.for(SongBlueprint).addSource({
            where: { artistId: { $inArray: true }, namespace: { $equals: true } },
            load: ({ criteria: { artistId, namespace } }) =>
                loadSongsByArtistIdsAndNamespace(artistId.value, namespace.value),
        });

        return loadSongsByArtistIdsAndNamespace;
    }

    useCreateSong() {
        const create = vi.fn<CreateEntityFn<SongBlueprint>>(({ entity: song }) => {
            const nextId = this.nextId("songs");

            const created: EntityBlueprint.Instance<SongBlueprint> = {
                id: nextId,
                name: song.name,
                albumId: song.albumId,
                artistId: song.artistId,
                duration: song.duration,
                metadata: song.metadata as any, // [todo] ❌ type assertion
                namespace: song.namespace,
            };

            this.entities.songs = [...(this.entities.songs ?? []), created];

            return Promise.resolve(created);
        });

        this.#services.for(SongBlueprint).addCreateOneMutator({ create });

        return create;
    }

    useUpdateSong() {
        const update = vi.fn<UpdateEntityFn<SongBlueprint>>(({ entity }) => {
            // [todo] ❌ type assertion
            return structuredClone(entity) as Song;
        });

        this.#services.for(SongBlueprint).addUpdateOneMutator({ update });

        return update;
    }

    useDeleteSong() {
        const del = vi.fn<DeleteEntityFn<SongBlueprint>>(() => {});

        this.#services.for(SongBlueprint).addDeleteOneMutator({
            delete: del,
        });

        return del;
    }

    useCreateSongTag() {
        const create = vi.fn<CreateEntityFn<SongTagBlueprint>>(({ entity: songTag }) => {
            const created: EntityBlueprint.Instance<SongTagBlueprint> = {
                songId: songTag.songId!, // [todo] ❌ type assertion
                tagId: songTag.tagId!, // [todo] ❌ type assertion
            };

            this.entities.songTags = [...(this.entities.songTags ?? []), created];

            return Promise.resolve(created);
        });

        this.#services.for(SongTagBlueprint).addCreateOneMutator({ create });

        return create;
    }
}

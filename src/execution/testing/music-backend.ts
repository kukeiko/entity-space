import { Entity, PackedEntitySelection } from "@entity-space/elements";
import {
    Album,
    AlbumBlueprint,
    Artist,
    ArtistBlueprint,
    Song,
    SongBlueprint,
    Tag,
    TagBlueprint,
} from "@entity-space/elements/testing";
import { Class } from "@entity-space/utils";
import { Mock, vi } from "vitest";
import { EntityServiceContainer } from "../entity-service-container";
import { EntityMutatorType } from "../mutation/entity-mutator";
import { EntityMutationContext } from "../mutation/structures/entity-mutation-context";

export { EntityMutatorType };

type MusicBackendOperation =
    | typeof EntityMutatorType.Create
    | typeof EntityMutatorType.Update
    | typeof EntityMutatorType.Delete;

export interface MutatorOptions<T> {
    /** register a one-entity mutator instead of a batch mutator */
    one?: boolean;
    select?: PackedEntitySelection<T>;
}

export interface Rejection {
    message: string;
    path?: string;
}

type Selection = Record<string, unknown>;
type Fail = (entity: Entity, error: Error, path?: string) => void;
type Persist = (entity: any, selection: Selection, fail: Fail, type: EntityMutatorType) => Entity | undefined;

/**
 * An in-memory API for artists, songs, albums and tags that persists whatever the selection of the mutator covers,
 * the same way a real backend accepting nested payloads would.
 */
export class MusicBackend {
    constructor(services: EntityServiceContainer) {
        this.#services = services;
    }

    readonly #services: EntityServiceContainer;
    readonly #rejections: ((entity: Entity, operation: MusicBackendOperation) => Rejection | undefined)[] = [];
    readonly #nextIds = { artists: 101, albums: 201, songs: 301, tags: 1 };

    readonly artists = new Map<string, Artist>();
    readonly albums = new Map<string, Album>();
    readonly songs = new Map<string, Song>();
    readonly tags = new Map<string, Tag>();

    /** Rejects any entity with the given name, as a server side validation of the "name" property would. */
    rejectName(
        name: string,
        operations: MusicBackendOperation[] = [
            EntityMutatorType.Create,
            EntityMutatorType.Update,
            EntityMutatorType.Delete,
        ],
    ): this {
        this.#rejections.push((entity, operation) =>
            (entity as { name?: string }).name === name && operations.includes(operation)
                ? { message: `name "${name}" is not allowed`, path: "name" }
                : undefined,
        );

        return this;
    }

    clearRejections(): this {
        this.#rejections.length = 0;
        return this;
    }

    useArtists(type: EntityMutatorType, options: MutatorOptions<Artist> = {}): Mock {
        return this.#register(ArtistBlueprint, type, options, (entity, selection, fail, type) =>
            type === EntityMutatorType.Delete
                ? this.#deleteArtist(entity, selection, fail)
                : this.#persistArtist(entity, selection, fail, type),
        );
    }

    useSongs(type: EntityMutatorType, options: MutatorOptions<Song> = {}): Mock {
        return this.#register(SongBlueprint, type, options, (entity, selection, fail, type) =>
            type === EntityMutatorType.Delete
                ? this.#deleteSong(entity, selection, fail)
                : this.#persistSong(entity, {}, selection, fail, type),
        );
    }

    useAlbums(type: EntityMutatorType, options: MutatorOptions<Album> = {}): Mock {
        return this.#register(AlbumBlueprint, type, options, (entity, selection, fail, type) =>
            type === EntityMutatorType.Delete
                ? this.#deleteAlbum(entity, fail)
                : this.#persistAlbum(entity, selection, fail),
        );
    }

    useTags(type: EntityMutatorType, options: MutatorOptions<Tag> = {}): Mock {
        return this.#register(TagBlueprint, type, options, (entity, _, fail, type) =>
            type === EntityMutatorType.Delete ? this.#deleteTag(entity, fail) : this.#persistTag(entity, fail),
        );
    }

    #register(blueprint: Class, type: EntityMutatorType, options: MutatorOptions<any>, persist: Persist): Mock {
        const services = this.#services.for(blueprint);
        const select = options.select;

        if (options.one) {
            const mutate = vi.fn(
                async ({ entity, selection, context }: { entity: Entity; selection: Selection; context: Ctx }) => {
                    let rootError: Error | undefined;
                    const fail: Fail = (failed, error, path) =>
                        failed === entity ? (rootError = error) : context.fail(failed, error, { path });
                    const result = persist(entity, selection, fail, type);

                    if (rootError) {
                        throw rootError;
                    }

                    return type === EntityMutatorType.Delete ? undefined : result;
                },
            );

            const add = {
                [EntityMutatorType.Create]: () => services.addCreateOneMutator({ select, create: mutate as any }),
                [EntityMutatorType.Update]: () => services.addUpdateOneMutator({ select, update: mutate as any }),
                [EntityMutatorType.Save]: () => services.addSaveOneMutator({ select, save: mutate as any }),
                [EntityMutatorType.Delete]: () => services.addDeleteOneMutator({ select, delete: mutate as any }),
            };

            add[type]();
            return mutate;
        } else {
            const mutate = vi.fn(
                async ({
                    entities,
                    selection,
                    context,
                }: {
                    entities: Entity[];
                    selection: Selection;
                    context: Ctx;
                }) => {
                    const fail: Fail = (failed, error, path) => context.fail(failed, error, { path });
                    const results = entities.map(entity => persist(entity, selection, fail, type));

                    return type === EntityMutatorType.Delete ? undefined : results.filter(result => result !== undefined);
                },
            );

            const add = {
                [EntityMutatorType.Create]: () => services.addCreateMutator({ select, create: mutate as any }),
                [EntityMutatorType.Update]: () => services.addUpdateMutator({ select, update: mutate as any }),
                [EntityMutatorType.Save]: () => services.addSaveMutator({ select, save: mutate as any }),
                [EntityMutatorType.Delete]: () => services.addDeleteMutator({ select, delete: mutate as any }),
            };

            add[type]();
            return mutate;
        }
    }

    #persistArtist(artist: Artist, selection: Selection, fail: Fail, type: EntityMutatorType): Artist | undefined {
        if (!this.#isValid(artist, artist.id ? EntityMutatorType.Update : EntityMutatorType.Create, fail)) {
            return undefined;
        }

        const id = this.#assertId(artist.id, type) || this.#nextIds.artists++;
        const { songs, ...rest } = artist;
        const persisted: Artist = { ...rest, id };

        if (selection.songs && songs) {
            persisted.songs = songs
                .map(song =>
                    this.#persistSong(
                        song,
                        { namespace: artist.namespace, artistId: id },
                        nested(selection.songs),
                        fail,
                        type,
                    ),
                )
                .filter(song => song !== undefined);

            if (type === EntityMutatorType.Save) {
                for (const [key, stored] of this.songs) {
                    if (stored.artistId === id && !persisted.songs.some(song => song.id === stored.id)) {
                        this.songs.delete(key);
                    }
                }
            }
        }

        this.artists.set(toKey(persisted), withoutRelations(persisted, ["songs"]));

        return persisted;
    }

    #persistSong(
        song: Song,
        overrides: Partial<Song>,
        selection: Selection,
        fail: Fail,
        type: EntityMutatorType,
    ): Song | undefined {
        if (!this.#isValid(song, song.id ? EntityMutatorType.Update : EntityMutatorType.Create, fail)) {
            return undefined;
        }

        const { artist, album, tags, ...rest } = song;
        const persisted: Song = { ...rest, ...overrides, id: this.#assertId(song.id, type) || this.#nextIds.songs++ };

        if (selection.artist && artist) {
            const persistedArtist = this.#persistArtist(artist, nested(selection.artist), fail, type);

            if (!persistedArtist) {
                fail(song, new Error("the artist of this song was not persisted"));
                return undefined;
            }

            persisted.artist = persistedArtist;
            persisted.artistId = persistedArtist.id;
        }

        if (selection.album && album) {
            const persistedAlbum = this.#persistAlbum(album, nested(selection.album), fail);

            if (!persistedAlbum) {
                fail(song, new Error("the album of this song was not persisted"));
                return undefined;
            }

            persisted.album = persistedAlbum;
            persisted.albumId = persistedAlbum.id;
        }

        if (selection.tags && tags) {
            persisted.tags = tags.map(tag => this.#persistTag(tag, fail)).filter(tag => tag !== undefined);
            persisted.tagIds = persisted.tags.map(tag => tag.id);
        }

        this.songs.set(toKey(persisted), withoutRelations(persisted, ["artist", "album", "tags"]));

        return persisted;
    }

    #persistAlbum(album: Album, selection: Selection, fail: Fail): Album | undefined {
        if (!this.#isValid(album, album.id ? EntityMutatorType.Update : EntityMutatorType.Create, fail)) {
            return undefined;
        }

        const { songs, artist, ...rest } = album;
        const persisted: Album = { ...rest, id: this.#assertId(album.id) || this.#nextIds.albums++ };

        if (selection.songs && songs) {
            persisted.songs = songs
                .map(song =>
                    this.#persistSong(song, { albumId: persisted.id }, nested(selection.songs), fail, EntityMutatorType.Save),
                )
                .filter(song => song !== undefined);
        }

        this.albums.set(toKey(persisted), withoutRelations(persisted, ["songs", "artist"]));

        return persisted;
    }

    #persistTag(tag: Tag, fail: Fail): Tag | undefined {
        if (!this.#isValid(tag, tag.id ? EntityMutatorType.Update : EntityMutatorType.Create, fail)) {
            return undefined;
        }

        if (tag.id.startsWith("-")) {
            throw new Error(`received a temporary Id: ${tag.id}`);
        }

        const { songs, ...rest } = tag;
        const persisted: Tag = { ...rest, id: tag.id || `tag-${this.#nextIds.tags++}` };
        this.tags.set(persisted.id, persisted);

        return persisted;
    }

    #deleteArtist(artist: Artist, selection: Selection, fail: Fail): undefined {
        if (selection.songs && artist.songs) {
            for (const song of artist.songs) {
                this.#deleteSong(song, nested(selection.songs), fail);
            }
        }

        if (this.#isValid(artist, EntityMutatorType.Delete, fail)) {
            this.artists.delete(toKey(artist));
        }

        return undefined;
    }

    #deleteSong(song: Song, _: Selection, fail: Fail): undefined {
        if (this.#isValid(song, EntityMutatorType.Delete, fail)) {
            this.songs.delete(toKey(song));
        }

        return undefined;
    }

    #deleteAlbum(album: Album, fail: Fail): undefined {
        if (this.#isValid(album, EntityMutatorType.Delete, fail)) {
            this.albums.delete(toKey(album));
        }

        return undefined;
    }

    #deleteTag(tag: Tag, fail: Fail): undefined {
        if (this.#isValid(tag, EntityMutatorType.Delete, fail)) {
            this.tags.delete(tag.id);
        }

        return undefined;
    }

    #isValid(entity: Entity, operation: MusicBackendOperation, fail: Fail): boolean {
        for (const reject of this.#rejections) {
            const rejection = reject(entity, operation);

            if (rejection) {
                fail(entity, new Error(rejection.message), rejection.path);
                return false;
            }
        }

        return true;
    }

    #assertId(id: number, type?: EntityMutatorType): number {
        if (id < 0) {
            throw new Error(`received a temporary Id: ${id}`);
        } else if (type === EntityMutatorType.Create && id) {
            throw new Error(`a create mutator received an existing entity: ${id}`);
        } else if (type === EntityMutatorType.Update && !id) {
            throw new Error("an update mutator received a new entity");
        }

        return id;
    }
}

type Ctx = EntityMutationContext;

/**
 * The entities a mutator received, one list per call (one-entity mutators receive a list of one).
 */
export function dispatched<T = Entity>(mutator: Mock): T[][] {
    return mutator.mock.calls.map(([args]) => (args.entities ?? [args.entity]) as T[]);
}

/**
 * The names of the entities a mutator received, one list per call.
 */
export function dispatchedNames(mutator: Mock): string[][] {
    return dispatched<{ name: string }>(mutator).map(entities => entities.map(entity => entity.name));
}

/**
 * The names of all entities a mutator received, across all calls.
 */
export function allDispatchedNames(mutator: Mock): string[] {
    return dispatchedNames(mutator).flat();
}

function nested(selection: unknown): Selection {
    return typeof selection === "object" && selection !== null ? (selection as Selection) : {};
}

function toKey(entity: { namespace: string; id: number }): string {
    return `${entity.namespace}:${entity.id}`;
}

function withoutRelations<T extends object>(entity: T, relations: string[]): T {
    const copy: Record<string, unknown> = { ...(entity as Record<string, unknown>) };

    for (const relation of relations) {
        delete copy[relation];
    }

    return copy as T;
}

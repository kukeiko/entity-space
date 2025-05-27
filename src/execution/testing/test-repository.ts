import { cloneEntity, EntityBlueprint } from "@entity-space/elements";
import {
    AlbumBlueprint,
    ArtistBlueprint,
    ArtistRequest,
    ArtistRequestBlueprint,
    RecordMetadata,
    SongBlueprint,
    TagBlueprint,
    UserBlueprint,
    UserRequest,
    UserRequestBlueprint,
} from "@entity-space/elements/testing";
import { vi } from "vitest";
import { EntityServiceContainer } from "../entity-service-container";
import { CreateEntityFn } from "../mutation/mutation-function.type";
import { defaultEntities, TestEntities } from "./default-entities";

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

export class TestRepository {
    constructor(services: EntityServiceContainer) {
        this.#services = services;
    }

    readonly #services: EntityServiceContainer;
    #testEntities: Partial<TestEntities> = {};

    useDefaultEntities(): this {
        this.#testEntities = structuredClone(defaultEntities);
        return this;
    }

    useEntities(entities: Partial<TestEntities>): this {
        this.#testEntities = structuredClone(entities);
        return this;
    }

    addLoadAllUsers() {
        const load = vi.fn(() => this.#filter("users"));

        this.#services.for(UserBlueprint).addSource({
            select: { metadata: { updatedAt: true, updatedById: true } },
            load: () => load(),
        });

        return load;
    }

    addLoadUserById() {
        const load = vi.fn((id: number) => this.#filter("users", filterById(id)));

        this.#services.for(UserBlueprint).addSource({
            where: { id: { $equals: true } },
            load: ({ criteria: { id } }) => load(id.value),
        });

        return load;
    }

    addLoadUsersByRequest() {
        const load = vi.fn((parameters: UserRequest) => {
            return this.#filter("users", undefined, parameters.pageSize ?? 3, parameters.page);
        });

        this.#services.for(UserBlueprint).addSource({
            parameters: UserRequestBlueprint,
            load: ({ parameters }) => load(parameters),
        });

        return load;
    }

    addLoadTagById() {
        const load = vi.fn((id: string) => this.#filter("tags", filterById(id)));

        this.#services.for(TagBlueprint).addSource({
            where: { id: { $equals: true } },
            load: ({ criteria: { id } }) => load(id.value),
        });

        return load;
    }

    addLoadArtistsByRequest() {
        const load = vi.fn((parameters: ArtistRequest) => {
            const page = parameters.page ?? 0;
            const pageSize = parameters.pageSize ?? 3;
            const sliceFrom = pageSize * page;
            const sliceTo = pageSize * (page + 1);

            return this.#filter("artists").slice(sliceFrom, sliceTo).map(cloneEntity);
        });

        this.#services.for(ArtistBlueprint).addSource({
            parameters: ArtistRequestBlueprint,
            load: ({ parameters }) => load(parameters),
        });

        return load;
    }

    addLoadArtistsByCreatedAt() {
        const load = vi.fn(
            (
                createdAt?: [string | undefined | null, string | undefined | null],
                updatedAt?: [string | undefined | null, string | undefined | null],
            ) => this.#filter("artists", filterByMetadataDates(createdAt, updatedAt)),
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
                return load(createdAt.value, updatedAt.value);
            },
        });

        return load;
    }

    addLoadArtistById() {
        const load = vi.fn((id: number) => this.#filter("artists", filterById(id)));

        this.#services.for(ArtistBlueprint).addSource({
            where: { id: { $equals: true } },
            load: ({ criteria: { id } }) => load(id.value),
        });

        return load;
    }

    addLoadArtistsByIds() {
        const loadArtistsById = vi.fn((ids: number[]) => this.#filter("artists", filterByIds(ids)));

        this.#services.for(ArtistBlueprint).addSource({
            where: { id: { $inArray: true } },
            load: ({ criteria: { id } }) => loadArtistsById(id.value),
        });

        return loadArtistsById;
    }

    addLoadArtistsByCountry() {
        const load = vi.fn((country?: string | null) => this.#filter("artists", artist => artist.country === country));

        this.#services.for(ArtistBlueprint).addSource({
            where: { country: { $equals: true } },
            load: ({ criteria: { country } }) => load(country.value),
        });

        return load;
    }

    addCreateArtist() {
        const create = vi.fn<CreateEntityFn<ArtistBlueprint>>(({ entity: artist }) => {
            const nextId = this.#nextId("artists");

            const created: EntityBlueprint.Instance<ArtistBlueprint> = {
                id: nextId,
                namespace: artist.namespace,
                metadata: { createdAt: new Date().toISOString(), createdById: 1 },
                name: artist.name,
            };

            this.#testEntities.artists = [...(this.#testEntities.artists ?? []), created];

            return Promise.resolve(created);
        });

        this.#services.for(ArtistBlueprint).addCreateMutator({ create });

        return create;
    }

    addLoadAlbumById() {
        const load = vi.fn((id: number) => this.#filter("albums", filterById(id)));

        this.#services.for(AlbumBlueprint).addSource({
            where: { id: { $equals: true } },
            load: ({ criteria: { id } }) => load(id.value),
        });

        return load;
    }

    addLoadSongsByArtistId() {
        const loadSongsByArtistId = vi.fn((artistIds: number[]) =>
            this.#filter("songs", song => artistIds.includes(song.artistId)),
        );

        this.#services.for(SongBlueprint).addSource({
            select: { tagIds: true },
            where: { artistId: { $inArray: true } },
            load: ({ criteria: { artistId } }) => loadSongsByArtistId(artistId.value),
        });

        return loadSongsByArtistId;
    }

    addLoadSongsByArtistIdAndNamespace() {
        const loadSongsByArtistIdsAndNamespace = vi.fn((artistIds: number[], namespace: string) =>
            this.#filter("songs", song => song.namespace === namespace && artistIds.includes(song.artistId)),
        );

        this.#services.for(SongBlueprint).addSource({
            where: { artistId: { $inArray: true }, namespace: { $equals: true } },
            load: ({ criteria: { artistId, namespace } }) =>
                loadSongsByArtistIdsAndNamespace(artistId.value, namespace.value),
        });

        return loadSongsByArtistIdsAndNamespace;
    }

    #filter<K extends keyof TestEntities>(
        entity: K,
        predicate?: (entity: TestEntities[K][number]) => boolean,
        pageSize?: number,
        page?: number,
    ): TestEntities[K] {
        let filtered = (this.#testEntities[entity] ?? []).filter(predicate ?? (() => true)).map(cloneEntity);

        if (pageSize) {
            page = page ?? 0;
            const sliceFrom = pageSize * page;
            const sliceTo = pageSize * (page + 1);

            filtered = filtered.slice(sliceFrom, sliceTo);
        }

        return filtered as TestEntities[K];
    }

    #nextId<K extends Exclude<keyof TestEntities, "tags">>(entity: K): number {
        const latest = (this.#testEntities[entity] ?? []).sort((a, b) => {
            return +b.id - +a.id;
        });

        return latest[0]?.id ?? 0 + 1;
    }
}

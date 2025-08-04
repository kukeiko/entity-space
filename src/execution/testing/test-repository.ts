import { EntityBlueprint, PackedEntitySelection } from "@entity-space/elements";
import {
    AlbumBlueprint,
    ArtistBlueprint,
    ArtistRequest,
    ArtistRequestBlueprint,
    Item,
    ItemAttributeType,
    ItemAttributeTypeBlueprint,
    ItemAttributeTypeCreatable,
    ItemAttributeTypeUpdatable,
    ItemBlueprint,
    ItemCreatable,
    ItemSavable,
    ItemSocket,
    ItemSocketBlueprint,
    ItemSocketCreatable,
    ItemSocketSavable,
    ItemSocketUpdatable,
    ItemUpdatable,
    RecordMetadata,
    SongBlueprint,
    TagBlueprint,
    UserBlueprint,
    UserRequest,
    UserRequestBlueprint,
} from "@entity-space/elements/testing";
import { jsonClone } from "@entity-space/utils";
import { vi } from "vitest";
import { EntityServiceContainer } from "../entity-service-container";
import { CreateEntityFn } from "../mutation/entity-mutation-function.type";
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

    useLoadAllUsers() {
        const load = vi.fn(() => this.#filter("users"));

        this.#services.for(UserBlueprint).addSource({
            select: { metadata: { updatedAt: true, updatedById: true } },
            load: () => load(),
        });

        return load;
    }

    useLoadUserById() {
        const load = vi.fn((id: number) => this.#filter("users", filterById(id)));

        this.#services.for(UserBlueprint).addSource({
            where: { id: { $equals: true } },
            load: ({ criteria: { id } }) => load(id.value),
        });

        return load;
    }

    useLoadUsersByRequest() {
        const load = vi.fn((parameters: UserRequest) => {
            return this.#filter("users", undefined, parameters.pageSize ?? 3, parameters.page);
        });

        this.#services.for(UserBlueprint).addSource({
            parameters: UserRequestBlueprint,
            load: ({ parameters }) => load(parameters),
        });

        return load;
    }

    useLoadTagById() {
        const load = vi.fn((id: string) => this.#filter("tags", filterById(id)));

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

            return jsonClone(this.#filter("artists").slice(sliceFrom, sliceTo));
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

    useLoadArtistById() {
        const load = vi.fn((id: number) => this.#filter("artists", filterById(id)));

        this.#services.for(ArtistBlueprint).addSource({
            where: { id: { $equals: true } },
            load: ({ criteria: { id } }) => load(id.value),
        });

        return load;
    }

    useLoadArtistsByIds() {
        const loadArtistsById = vi.fn((ids: number[]) => this.#filter("artists", filterByIds(ids)));

        this.#services.for(ArtistBlueprint).addSource({
            where: { id: { $inArray: true } },
            load: ({ criteria: { id } }) => loadArtistsById(id.value),
        });

        return loadArtistsById;
    }

    useLoadArtistsByCountry() {
        const load = vi.fn((country?: string | null) => this.#filter("artists", artist => artist.country === country));

        this.#services.for(ArtistBlueprint).addSource({
            where: { country: { $equals: true } },
            load: ({ criteria: { country } }) => load(country.value),
        });

        return load;
    }

    useCreateArtist() {
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

        this.#services.for(ArtistBlueprint).addCreateOneMutator({ create });

        return create;
    }

    useLoadAlbumById() {
        const load = vi.fn((id: number) => this.#filter("albums", filterById(id)));

        this.#services.for(AlbumBlueprint).addSource({
            where: { id: { $equals: true } },
            load: ({ criteria: { id } }) => load(id.value),
        });

        return load;
    }

    useLoadSongsByArtistId() {
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

    useLoadSongsByArtistIdAndNamespace() {
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

    useCreateItems(createdAt: string) {
        const createItem = vi.fn(
            ({ entities, selection }: { entities: ItemCreatable[]; selection: PackedEntitySelection<Item> }) => {
                console.log("🆕 create Item received:");
                console.dir(entities, { depth: null });
                const items = structuredClone(entities);

                for (const item of items) {
                    item.id = item.assignId;
                    item.createdAt = createdAt;

                    // [todo] ❌ commented out to remind myself of: add validation to entities returned from user mutation functions
                    // making sure entities are properly hydrated
                    // item.updatedAt = null;
                }

                return items as Item[];
            },
        );

        this.#services.for(ItemBlueprint).addCreateMutator({
            create: createItem,
        });

        return createItem;
    }

    useUpdateItems(updatedAt: string) {
        const updateItems = vi.fn(({ entities }: { entities: ItemUpdatable[] }) => {
            console.log("✏️ update Item received:");
            console.dir(entities, { depth: null });
            const items = structuredClone(entities);

            for (const item of items) {
                item.updatedAt = updatedAt;
            }

            // [todo] ❓ do we really expect users to return the fully loaded entities?
            return items as Item[];
        });

        this.#services.for(ItemBlueprint).addUpdateMutator({
            update: updateItems,
        });

        return updateItems;
    }

    useSaveItems(createdAt: string, updatedAt: string) {
        const saveItems = vi.fn(
            ({ entities, selection }: { entities: ItemSavable[]; selection: PackedEntitySelection<Item> }) => {
                console.log("💾 save Item received:");
                console.dir(entities, { depth: null });
                const items = structuredClone(entities) as ItemSavable[];

                for (const item of items) {
                    if (!item.id) {
                        item.id = item.assignId;
                        item.createdAt = createdAt;
                    }

                    if (selection.sockets && item.sockets) {
                        // [todo] ❌ type issue in "ItemSavable", item.sockets[number] allows "undefined"
                        for (const socket of item.sockets as ItemSocketSavable[]) {
                            if (!socket.id) {
                                socket.id = socket.assignId;
                                socket.createdAt = createdAt;
                                socket.updatedAt = null;
                                socket.itemId = item.id;
                            } else {
                                socket.updatedAt = updatedAt;
                            }
                        }
                    }

                    item.updatedAt = updatedAt;
                }

                return items as Item[];
            },
        );

        this.#services.for(ItemBlueprint).addSaveMutator({
            select: { sockets: true },
            save: saveItems,
        });

        return saveItems;
    }

    useDeleteItems() {
        const deleteItems = vi.fn(
            ({ entities, selection }: { entities: Item[]; selection: PackedEntitySelection<Item> }) => {
                console.log("❌ delete Item received:");
                console.dir(entities, { depth: null });
                const items = structuredClone(entities) as Item[];
                return items;
            },
        );

        this.#services.for(ItemBlueprint).addDeleteMutator({
            delete: deleteItems,
        });

        return deleteItems;
    }

    useCreateItemSockets(createdAt: string) {
        const createItemSockets = vi.fn(
            ({
                entities,
                selection,
            }: {
                entities: ItemSocketCreatable[];
                selection: PackedEntitySelection<ItemSocket>;
            }) => {
                console.log("🆕 create ItemSocket received:");
                console.dir(entities, { depth: null });
                const itemSockets = structuredClone(entities);

                for (const itemSocket of itemSockets) {
                    itemSocket.id = itemSocket.assignId;
                    itemSocket.createdAt = createdAt;
                }

                return itemSockets as ItemSocket[];
            },
        );

        this.#services.for(ItemSocketBlueprint).addCreateMutator({
            create: createItemSockets,
        });

        return createItemSockets;
    }

    useUpdateItemSockets(updatedAt: string) {
        const updateItemSockets = vi.fn(
            ({
                entities,
                selection,
            }: {
                entities: ItemSocketUpdatable[];
                selection: PackedEntitySelection<ItemSocket>;
            }) => {
                console.log("✏️ update ItemSocket received:");
                console.dir(entities, { depth: null });
                const items = structuredClone(entities);

                for (const item of items) {
                    item.updatedAt = updatedAt;
                }

                return items as ItemSocket[];
            },
        );

        this.#services.for(ItemSocketBlueprint).addUpdateMutator({
            update: updateItemSockets,
        });

        return updateItemSockets;
    }

    useDeleteItemSockets() {
        const deleteItems = vi.fn(
            ({ entities, selection }: { entities: ItemSocket[]; selection: PackedEntitySelection<ItemSocket> }) => {
                console.log("❌ delete ItemSocket received:");
                console.dir(entities, { depth: null });
                return structuredClone(entities);
            },
        );

        this.#services.for(ItemSocketBlueprint).addDeleteMutator({
            delete: deleteItems,
        });

        return deleteItems;
    }

    useCreateItemAttributeTypes(createdAt: string) {
        const createItemAttributeTypes = vi.fn(
            ({
                entities,
                selection,
            }: {
                entities: ItemAttributeTypeCreatable[];
                selection: PackedEntitySelection<ItemSocket>;
            }) => {
                console.log("🆕 create ItemAttributeType received:");
                console.dir(entities, { depth: null });
                const itemAttributeTypes = structuredClone(entities) as ItemAttributeTypeCreatable[];

                for (const itemAttributeType of itemAttributeTypes) {
                    itemAttributeType.id = itemAttributeType.assignId;
                    itemAttributeType.createdAt = createdAt;
                }

                return itemAttributeTypes as ItemAttributeType[];
            },
        );

        this.#services.for(ItemAttributeTypeBlueprint).addCreateMutator({
            create: createItemAttributeTypes,
        });

        return createItemAttributeTypes;
    }

    useUpdateItemAttributeTypes(updatedAt: string) {
        const updateItemAttributeTypes = vi.fn(
            ({
                entities,
                selection,
            }: {
                entities: ItemAttributeTypeUpdatable[];
                selection: PackedEntitySelection<ItemSocket>;
            }) => {
                console.log("✏️ update ItemAttributeType received:");
                console.dir(entities, { depth: null });
                const items = structuredClone(entities);

                for (const item of items) {
                    item.updatedAt = updatedAt;
                }

                return items as ItemAttributeType[];
            },
        );

        this.#services.for(ItemAttributeTypeBlueprint).addUpdateMutator({
            update: updateItemAttributeTypes,
        });

        return updateItemAttributeTypes;
    }

    useDeleteItemAttributeTypes() {
        const deleteItemAttributeTypes = vi.fn(
            ({
                entities,
                selection,
            }: {
                entities: ItemAttributeType[];
                selection: PackedEntitySelection<ItemSocket>;
            }) => {
                console.log("❌ delete ItemAttributeType received:");
                console.dir(entities, { depth: null });
                return structuredClone(entities);
            },
        );

        this.#services.for(ItemAttributeTypeBlueprint).addDeleteMutator({
            delete: deleteItemAttributeTypes,
        });

        return deleteItemAttributeTypes;
    }

    #filter<K extends keyof TestEntities>(
        entity: K,
        predicate?: (entity: TestEntities[K][number]) => boolean,
        pageSize?: number,
        page?: number,
    ): TestEntities[K] {
        let filtered = jsonClone((this.#testEntities[entity] ?? []).filter(predicate ?? (() => true)));

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

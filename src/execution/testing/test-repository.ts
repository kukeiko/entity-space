import { EntityBlueprint, PackedEntitySelection } from "@entity-space/elements";
import {
    AlbumBlueprint,
    Artist,
    ArtistBlueprint,
    ArtistRequest,
    ArtistRequestBlueprint,
    File,
    FileBlueprint,
    FileSavable,
    Folder,
    FolderBlueprint,
    FolderSavable,
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
    ItemType,
    ItemTypeBlueprint,
    ItemTypeSavable,
    ItemUpdatable,
    ProductBlueprint,
    RecordMetadata,
    Song,
    SongBlueprint,
    TagBlueprint,
    Tree,
    TreeBlueprint,
    TreeSavable,
    User,
    UserBlueprint,
    UserRequest,
    UserRequestBlueprint,
    UserSavable,
    WashingMachineBlueprint,
} from "@entity-space/elements/testing";
import { jsonClone } from "@entity-space/utils";
import { uniqBy } from "lodash";
import { vi } from "vitest";
import { EntityServiceContainer } from "../entity-service-container";
import {
    CreateEntitiesFn,
    CreateEntityFn,
    SaveEntitiesFn,
    UpdateEntitiesFn,
} from "../mutation/entity-mutation-function.type";
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
    #testEntities: TestEntities = {
        albums: [],
        artists: [],
        folders: [],
        songs: [],
        tags: [],
        songTags: [],
        trees: [],
        users: [],
        products: [],
        washingMachines: [],
    };

    useDefaultEntities(): this {
        this.#testEntities = structuredClone(defaultEntities);
        return this;
    }

    useEntities(entities: Partial<TestEntities>): this {
        this.#testEntities = { ...this.#testEntities, ...structuredClone(entities) };
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

    useHydrateUserCreatedByName() {
        const hydrate = vi.fn((users: User[]) => {
            users.forEach(user => (user.createdByName = user.metadata.createdBy!.name));
        });

        this.#services.for(UserBlueprint).addHydrator({
            select: { createdByName: true },
            requires: { metadata: { createdBy: true } },
            hydrate,
        });

        return hydrate;
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
                // [todo] ❌ bug: elvis not required if we make RecordMetadata.updatedAt optional
                return load(createdAt.value, updatedAt?.value);
            },
        });

        return load;
    }

    useLoadArtistById() {
        const load = vi.fn((id: number) => this.#filter("artists", filterById(id)));

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
            const nextId = this.#nextId("artists");

            const created: EntityBlueprint.Instance<ArtistBlueprint> = {
                id: nextId,
                namespace: artist.namespace,
                metadata: { createdAt: new Date().toISOString(), createdById: 1, updatedAt: null, updatedById: null },
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

    useLoadSongById() {
        const load = vi.fn((id: number) => this.#filter("songs", filterById(id)));

        this.#services.for(SongBlueprint).addSource({
            where: { id: { $equals: true } },
            load: ({ criteria: { id } }) => load(id.value),
        });

        return load;
    }

    useLoadSongByName() {
        const load = vi.fn((name: string) => this.#filter("songs", song => song.name === name));

        this.#services.for(SongBlueprint).addSource({
            where: { name: { $equals: true } },
            load: ({ criteria: { name } }) => load(name.value),
        });

        return load;
    }

    useLoadSongsByArtistId() {
        const loadSongsByArtistId = vi.fn((artistIds: number[]) =>
            this.#filter("songs", song => artistIds.includes(song.artistId)),
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
                        (song.tagIds = this.#filter("songTags", songTag => songTag.songId === song.id).map(
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
            this.#filter("songs", song => song.namespace === namespace && artistIds.includes(song.artistId)),
        );

        this.#services.for(SongBlueprint).addSource({
            where: { artistId: { $inArray: true }, namespace: { $equals: true } },
            load: ({ criteria: { artistId, namespace } }) =>
                loadSongsByArtistIdsAndNamespace(artistId.value, namespace.value),
        });

        return loadSongsByArtistIdsAndNamespace;
    }

    useSaveItems_deprecated(createdAt: string, updatedAt: string, includeSockets = true) {
        const saveItems = vi.fn(
            ({ entities, selection }: { entities: ItemSavable[]; selection: PackedEntitySelection<Item> }) => {
                const items = structuredClone(entities) as ItemSavable[];

                for (const item of items) {
                    if (!item.id) {
                        item.id = item.assignId;
                        item.createdAt = createdAt;
                    }

                    if (includeSockets && selection.sockets && item.sockets) {
                        for (const socket of item.sockets) {
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
            select: includeSockets ? { sockets: true } : {},
            save: saveItems,
        });

        return saveItems;
    }

    useSaveItems(createdAt: string, updatedAt: string, includeSockets = false) {
        const saveItems = vi.fn(({ entities }: Parameters<SaveEntitiesFn<ItemBlueprint, {}>>[0]) => {
            const items = structuredClone(entities) as ItemSavable[];

            for (const item of items) {
                if (!item.id) {
                    item.id = item.assignId;
                    item.createdAt = createdAt;
                    item.updatedAt = null;
                } else {
                    item.updatedAt = updatedAt;
                }

                if (includeSockets && item.sockets) {
                    for (const itemSocket of item.sockets) {
                        if (!itemSocket.id) {
                            itemSocket.id = itemSocket.assignId;
                            itemSocket.createdAt = createdAt;
                            itemSocket.updatedAt = null;
                        } else {
                            itemSocket.updatedAt = updatedAt;
                        }
                    }
                }
            }

            return items as Item[];
        });

        this.#services.for(ItemBlueprint).addSaveMutator({
            select: includeSockets ? { sockets: true } : {},
            save: saveItems,
        });

        return saveItems;
    }

    useCreateItems(createdAt: string) {
        const createItem = vi.fn(
            ({ entities, selection }: { entities: ItemCreatable[]; selection: PackedEntitySelection<Item> }) => {
                const items = structuredClone(entities);

                for (const item of items) {
                    item.id = item.assignId;
                    item.createdAt = createdAt;
                    item.updatedAt = null;

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

    useDeleteItems() {
        const deleteItems = vi.fn(
            ({ entities, selection }: { entities: Item[]; selection: PackedEntitySelection<Item> }) => {},
        );

        this.#services.for(ItemBlueprint).addDeleteMutator({
            delete: deleteItems,
        });

        return deleteItems;
    }

    useSaveItemTypes() {
        const saveItemTypes = vi.fn(({ entities }: Parameters<SaveEntitiesFn<ItemTypeBlueprint, {}>>[0]) => {
            const items = structuredClone(entities) as ItemTypeSavable[];

            for (const item of items) {
                if (!item.id) {
                    item.id = item.assignId;
                }
            }

            return items as ItemType[];
        });

        this.#services.for(ItemTypeBlueprint).addSaveMutator({ save: saveItemTypes });

        return saveItemTypes;
    }

    useCreateItemTypes() {
        const createItemTypes = vi.fn(({ entities }: Parameters<CreateEntitiesFn<ItemTypeBlueprint, {}>>[0]) => {
            const items = structuredClone(entities);

            for (const item of items) {
                item.id = item.assignId;
            }

            return items as ItemType[];
        });

        this.#services.for(ItemTypeBlueprint).addCreateMutator({ create: createItemTypes });

        return createItemTypes;
    }

    useUpdateItemTypes() {
        const updateItemTypes = vi.fn(({ entities }: Parameters<UpdateEntitiesFn<ItemTypeBlueprint, {}>>[0]) => {
            const items = structuredClone(entities);
            return items as ItemType[];
        });

        this.#services.for(ItemTypeBlueprint).addUpdateMutator({ update: updateItemTypes });

        return updateItemTypes;
    }

    useSaveItemSockets(createdAt: string, updatedAt: string) {
        const saveItemSockets = vi.fn(({ entities }: Parameters<SaveEntitiesFn<ItemSocketBlueprint, {}>>[0]) => {
            const itemSockets = structuredClone(entities) as ItemSocketSavable[];

            for (const itemSocket of itemSockets) {
                if (!itemSocket.id) {
                    itemSocket.id = itemSocket.assignId;
                    itemSocket.createdAt = createdAt;
                    itemSocket.updatedAt = null;
                } else {
                    itemSocket.updatedAt = updatedAt;
                }
            }

            return itemSockets as ItemSocket[];
        });

        this.#services.for(ItemSocketBlueprint).addSaveMutator({ save: saveItemSockets });

        return saveItemSockets;
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
                const itemSockets = structuredClone(entities);

                for (const itemSocket of itemSockets) {
                    itemSocket.id = itemSocket.assignId;
                    itemSocket.createdAt = createdAt;
                    itemSocket.updatedAt = null;
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
            ({ entities, selection }: { entities: ItemSocket[]; selection: PackedEntitySelection<ItemSocket> }) => {},
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
            }) => {},
        );

        this.#services.for(ItemAttributeTypeBlueprint).addDeleteMutator({
            delete: deleteItemAttributeTypes,
        });

        return deleteItemAttributeTypes;
    }

    useLoadAllTrees() {
        const load = vi.fn(() => this.#filter("trees"));

        this.#services.for(TreeBlueprint).addSource({
            load: () => load(),
        });

        return load;
    }

    useLoadAllTreesWithFirstLevelBranchesMetadataCreatedBy() {
        const load = vi.fn(() => this.#filter("trees"));

        this.#services.for(TreeBlueprint).addSource({
            load: ({ selection }) => {
                const trees = load();

                if (selection.branches?.metadata?.createdBy) {
                    for (const tree of trees) {
                        for (const branch of tree.branches) {
                            branch.metadata.createdBy = this.#filter(
                                "users",
                                user => user.id === branch.metadata.createdById,
                            )[0];
                        }
                    }
                }

                return trees;
            },
            select: { branches: { metadata: { createdBy: true } } },
        });

        return load;
    }

    useLoadAllFolders() {
        const load = vi.fn(() => this.#filter("folders"));

        this.#services.for(FolderBlueprint).addSource({
            load: () => load(),
        });

        return load;
    }

    useSaveTrees() {
        const save = vi.fn(
            ({ entities, selection }: { entities: TreeSavable[]; selection: PackedEntitySelection<Tree> }) => {
                entities = structuredClone(entities);

                for (const entity of entities) {
                    entity.id = this.#nextId("trees");
                }

                return entities as Tree[];
            },
        );

        this.#services.for(TreeBlueprint).addSaveMutator({
            save,
            select: {
                branches: {
                    branches: "*",
                },
            },
        });

        return save;
    }

    useDeleteTrees() {
        const deleteTrees = vi.fn(
            ({ entities, selection }: { entities: Tree[]; selection: PackedEntitySelection<Tree> }) => {},
        );

        this.#services.for(TreeBlueprint).addDeleteMutator({
            delete: deleteTrees,
        });

        return deleteTrees;
    }

    useSaveFolders() {
        const save = vi.fn(
            ({ entities, selection }: { entities: FolderSavable[]; selection: PackedEntitySelection<Folder> }) => {
                entities = structuredClone(entities);

                for (const entity of entities) {
                    entity.id = this.#nextId("folders");
                    this.#testEntities.folders.push(entity as Folder);
                }

                return entities as Folder[];
            },
        );

        this.#services.for(FolderBlueprint).addSaveMutator({
            save,
        });

        return save;
    }

    useDeleteFolders() {
        const deleteFolders = vi.fn(
            ({ entities, selection }: { entities: Folder[]; selection: PackedEntitySelection<Folder> }) => {},
        );

        this.#services.for(FolderBlueprint).addDeleteMutator({
            delete: deleteFolders,
        });

        return deleteFolders;
    }

    useSaveFiles() {
        const save = vi.fn(
            ({ entities, selection }: { entities: FileSavable[]; selection: PackedEntitySelection<File> }) => {
                entities = structuredClone(entities);

                // for (const entity of entities) {
                //     entity.id = this.#nextId("trees");
                //     entity.metadata = createMetadata(createdById, undefined, createdAt);

                //     // [todo] ❌ commented out to remind myself of: add validation to entities returned from user mutation functions
                //     // making sure entities are properly hydrated
                //     // item.updatedAt = null;
                // }

                return entities as File[];
            },
        );

        this.#services.for(FileBlueprint).addSaveMutator({
            save,
        });

        return save;
    }

    useDeleteFiles() {
        const del = vi.fn(
            ({ entities, selection }: { entities: File[]; selection: PackedEntitySelection<File> }) => {},
        );

        this.#services.for(FileBlueprint).addDeleteMutator({
            delete: del,
        });

        return del;
    }

    useSaveUsers() {
        const save = vi.fn(
            ({ entities, selection }: { entities: UserSavable[]; selection: PackedEntitySelection<Item> }) => {
                entities = structuredClone(entities);

                for (const entity of entities) {
                    entity.id = this.#nextId("users");
                    // entity.metadata = createMetadata(createdById, undefined, createdAt);

                    // [todo] ❌ commented out to remind myself of: add validation to entities returned from user mutation functions
                    // making sure entities are properly hydrated
                    // item.updatedAt = null;
                }

                return entities as User[];
            },
        );

        this.#services.for(UserBlueprint).addSaveMutator({
            save,
        });

        return save;
    }

    useDeleteUsers() {
        const deleteUsers = vi.fn(
            ({ entities, selection }: { entities: User[]; selection: PackedEntitySelection<User> }) => {},
        );

        this.#services.for(UserBlueprint).addDeleteMutator({
            delete: deleteUsers,
        });

        return deleteUsers;
    }

    useLoadProductById() {
        const load = vi.fn((id: number) => this.#filter("products", filterById(id)));

        this.#services.for(ProductBlueprint).addSource({
            where: { id: { $equals: true } },
            load: ({ criteria: { id } }) => load(id.value),
        });

        return load;
    }

    useCreateProduct() {
        const create = vi.fn<CreateEntityFn<ProductBlueprint>>(({ entity: product }) => {
            const nextId = this.#nextId("products");

            const created: EntityBlueprint.Instance<ProductBlueprint> = {
                id: nextId,
                name: product.name,
                price: product.price,
            };

            this.#testEntities.products = [...(this.#testEntities.products ?? []), created];

            return Promise.resolve(created);
        });

        this.#services.for(ProductBlueprint).addCreateOneMutator({ create });

        return create;
    }

    useLoadAllWashingMachines() {
        const load = vi.fn(() => this.#filter("washingMachines"));

        this.#services.for(WashingMachineBlueprint).addSource({ load });

        return load;
    }

    useCreateWashingMachine() {
        const create = vi.fn<CreateEntityFn<WashingMachineBlueprint>>(({ entity: washingMachine }) => {
            const created: EntityBlueprint.Instance<WashingMachineBlueprint> = {
                id: washingMachine.id,
                maxLoadKg: washingMachine.maxLoadKg,
            };

            this.#testEntities.washingMachines = [...(this.#testEntities.washingMachines ?? []), created];

            return Promise.resolve(created);
        });

        this.#services.for(WashingMachineBlueprint).addCreateOneMutator({ create });

        return create;
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

    #nextId<K extends Exclude<keyof TestEntities, "tags" | "songTags">>(entity: K): number {
        const latest = (this.#testEntities[entity] ?? []).sort((a, b) => {
            return +b.id - +a.id;
        });

        return (latest[0]?.id ?? 0) + 1;
    }
}

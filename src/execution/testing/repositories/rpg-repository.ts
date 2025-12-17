import { PackedEntitySelection } from "@entity-space/elements";
import {
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
} from "@entity-space/elements/testing";
import { vi } from "vitest";
import { EntityServiceContainer } from "../../entity-service-container";
import { CreateEntitiesFn, SaveEntitiesFn, UpdateEntitiesFn } from "../../mutation/entity-mutation-function.type";
import { InMemoryRepository } from "./in-memory-repository";

type RpgEntities = {
    items: Item[];
    itemTypes: ItemType[];
    itemSockets: ItemSocket[];
    itemAttributeTypes: ItemAttributeType[];
};

export class RpgRepository extends InMemoryRepository<RpgEntities> {
    constructor(services: EntityServiceContainer) {
        super();
        this.#services = services;
    }

    readonly #services: EntityServiceContainer;

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
}

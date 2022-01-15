import { isDefined } from "@entity-space/utils";
import { EntitySchema } from "../schema/public";
import { Entity } from "./entity";
import { EntityReader } from "./entity-reader";
import { EntityStoreIndex, IndexValue } from "./entity-store-index";
import { UnbakedEntityReader } from "./unbaked-entity-reader";

export class EntityStore {
    constructor(schema: EntitySchema, entityReader: EntityReader = new UnbakedEntityReader()) {
        if (!schema.hasKey()) {
            throw new Error(`can't create entity-store for a schema that has no key defined`);
        }

        this.schema = schema;
        this.key = new EntityStoreIndex(schema.getKey(), entityReader);
        const indexes: Record<string, EntityStoreIndex> = {};

        for (const schemaIndex of schema.getIndexes()) {
            indexes[schemaIndex.getName()] = new EntityStoreIndex(schemaIndex, entityReader);
        }

        this.indexes = indexes;
    }

    private readonly schema: EntitySchema;
    private readonly key: EntityStoreIndex;
    private readonly indexes: Record<string, EntityStoreIndex>;
    private items: (Entity | undefined)[] = [];

    getId(): string {
        return this.schema.getId();
    }

    getAll(): Entity[] {
        return this.items.filter(isDefined);
    }

    getByKey(keyValue: IndexValue): Entity | undefined {
        return this.getByIndexInternal(this.key, [keyValue])[0];
    }

    getIndexesIncludingKey(): EntityStoreIndex[] {
        return [this.key, ...this.getIndexes()];
    }

    getIndexes(): EntityStoreIndex[] {
        return Object.values(this.indexes);
    }

    getIndex(name: string): EntityStoreIndex {
        const index = this.indexes[name];

        if (index === void 0) {
            throw new Error(`index ${name} not found in object-store ${this.getId()}`);
        }

        return index;
    }

    getByKeys(keys: IndexValue[]): Entity[] {
        return this.getByIndexInternal(this.key, keys).filter(isDefined);
    }

    getKeyIndex(): EntityStoreIndex {
        return this.key;
    }

    private getByIndexInternal(index: EntityStoreIndex, values: IndexValue[]): Entity[] {
        const recordIndexes = index.get(values);
        const items: Entity[] = [];

        for (const recordIndex of recordIndexes) {
            const item = this.items[recordIndex];

            if (item !== void 0) {
                items.push(item);
            }
        }

        return items;
    }

    getByIndexOrKey(name: string, values: IndexValue[]): Entity[] {
        if (this.key.getName() === name) {
            return this.getByIndexInternal(this.key, values);
        }
        
        return this.getByIndex(name, values);
    }

    getByIndex(name: string, values: IndexValue[]): Entity[] {
        const index = this.indexes[name];

        if (index === void 0) {
            throw new Error(`index not found: ${name}`);
        }

        return this.getByIndexInternal(index, values);
    }

    getIndexMatchingKeyPaths(keyPaths: string[]): EntityStoreIndex {
        const keyPathsJson = JSON.stringify(keyPaths.sort());

        for (const indexCandidate of this.getIndexesIncludingKey()) {
            const indexKeys = indexCandidate.getPath();

            if (indexKeys.length !== keyPaths.length) {
                continue;
            }

            if (JSON.stringify(indexKeys.slice().sort()) === keyPathsJson) {
                return indexCandidate;
            }
        }

        throw new Error(`failed to find index on ${this.getId()} matching keyPaths: ${JSON.stringify(keyPaths)}`);
    }

    // [todo] how to handle case where items may already exist in indexes :?
    add(items: Entity[]): void {
        const keyIndex = this.getKeyIndex();

        for (const item of items) {
            const storedArrayIndex = keyIndex.get(keyIndex.read([item]))[0];
            const arrayIndex = storedArrayIndex ?? this.items.length;
            this.items[arrayIndex] = item;

            if (storedArrayIndex === void 0) {
                keyIndex.add(item, arrayIndex);
            }

            // [todo] if it already existet, it's values to index might've changed, which we're not accounting for yet.
            for (const indexName in this.indexes) {
                this.indexes[indexName].add(item, arrayIndex);
            }
        }
    }

    clear(): void {
        this.items = [];

        for (const indexName in this.indexes) {
            this.indexes[indexName].clear();
        }
    }
}

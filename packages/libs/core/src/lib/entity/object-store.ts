import { isDefined } from "@entity-space/utils";
import { Schema } from "../schema/schema";
import { IndexValue, ObjectStoreIndex } from "./object-store-index";

export class ObjectStore<V = any> {
    // [todo] would be nice to use this commented out line, but then we can't just supply
    // the argument by using e.g. "new Schema({ key: ... })" cause of key being optional in Schema.ctor()
    // constructor(schema: SchemaWithKey) {
    constructor(schema: Schema) {
        if (!schema.hasKey()) {
            throw new Error(`can't create object-store for schema that has no key defined`);
        }

        this.schema = schema;
        const indexes: Record<string, ObjectStoreIndex> = {};

        for (const schemaIndex of schema.getAllIndexes()) {
            indexes[schemaIndex.name] = new ObjectStoreIndex(schemaIndex);
        }

        this.indexes = indexes;
    }

    private readonly schema: Schema;

    get name(): string {
        return this.schema.getSchemaName();
    }

    private readonly indexes: Record<string, ObjectStoreIndex>;
    private items: (V | undefined)[] = [];

    getAll(): V[] {
        return this.items.filter(isDefined);
    }

    getByKey(key: IndexValue): V | undefined {
        return this.getByIndex(this.schema.getKeyIndex().name, [key])[0];
    }

    getIndexes(): ObjectStoreIndex[] {
        return Object.values(this.indexes);
    }

    getIndex(name: string): ObjectStoreIndex {
        const index = this.indexes[name];

        if (index === void 0) {
            throw new Error(`index ${name} not found in object-store ${this.name}`);
        }

        return index;
    }

    getByKeys(keys: IndexValue[]): V[] {
        return keys.map(key => this.getByKey(key)).filter(isDefined);
    }

    getKeyIndex(): ObjectStoreIndex {
        return this.getIndex(this.schema.getKeyIndex().name);
    }

    getByIndex(name: string, values: IndexValue[]): V[] {
        const index = this.indexes[name];

        if (index === void 0) {
            throw new Error(`index not found: ${name}`);
        }

        const recordIndexes = index.get(values);
        const items: V[] = [];

        for (const recordIndex of recordIndexes) {
            const item = this.items[recordIndex];

            if (item !== void 0) {
                items.push(item);
            }
        }

        return items;
    }

    getIndexMatchingKeyPaths(keyPaths: string[]): ObjectStoreIndex {
        const keyPathsJson = JSON.stringify(keyPaths.sort());

        for (const indexCandidate of this.getIndexes()) {
            const indexKeys = indexCandidate.path;

            if (indexKeys.length !== keyPaths.length) {
                continue;
            }

            if (JSON.stringify(indexKeys.slice().sort()) === keyPathsJson) {
                return indexCandidate;
            }
        }

        throw new Error(`failed to find index on ${this.name} matching keyPaths: ${JSON.stringify(keyPaths)}`);
    }

    // [todo] handle case where items my already exist in indexes?
    add(items: any[]): void {
        const keyIndex = this.getKeyIndex();

        for (const item of items) {
            const storedArrayIndex = keyIndex.get(keyIndex.read([item]))[0];
            let arrayIndex = storedArrayIndex ?? this.items.length;
            this.items[arrayIndex] = item;

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

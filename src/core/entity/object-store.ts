import { isDefined } from "../../utils/is-defined.fn";
import { Schema } from "./metadata/schema";
import { IndexValue, ObjectStoreIndex } from "./object-store-index";

type KeyValue = (string | number) | (string | number)[];

// [todo] not happy with various method/variable/type names, revisit.
export class ObjectStore<V = any> {
    constructor(schema: Schema) {
        const key = schema.key;

        if (key === void 0) {
            throw new Error(`can't create object-store for schema that has no key defined`);
        }

        this.name = schema.name;
        this.keyIndexName = key.name;

        const storeIndexes: Record<string, ObjectStoreIndex> = {};

        for (const schemaIndex of schema.getIndexes()) {
            storeIndexes[schemaIndex.name] = new ObjectStoreIndex(schemaIndex);
        }

        this.indexes = storeIndexes;
    }

    readonly name: string;
    private readonly keyIndexName: string;
    private readonly indexes: Record<string, ObjectStoreIndex>;
    private items: (V | undefined)[] = [];

    getAll(): V[] {
        return this.items.filter(isDefined);
    }

    getByKey(key: KeyValue): V | undefined {
        return this.getByIndex(this.keyIndexName, [key])[0];
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

    getByKeys(keys: KeyValue[]): V[] {
        return keys.map(key => this.getByKey(key)).filter(isDefined);
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
        for (const item of items) {
            const itemsIndex = this.items.length;
            this.items.push(item);

            for (const indexName in this.indexes) {
                this.indexes[indexName].insert(item, itemsIndex);
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

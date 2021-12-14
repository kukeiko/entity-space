import { isDefined } from "../../utils/is-defined.fn";
import { SchemaIndex } from "./metadata/schema";
import { IndexValue, ObjectStoreIndex } from "./object-store-index";

type KeyValue = (string | number) | (string | number)[];

/**
 * [todo] copied over from a file that i've last worked on some years ago, so some polish is needed
 * since i've changed my code style quite a bit
 */

const KEY_INDEX_NAME = "key";

// [todo] not happy with various method/variable/type names, revisit.
export class ObjectStore<V = any> {
    constructor(name: string, key: string[], indexes?: Record<string, SchemaIndex>) {
        this.name = name;
        this.key = key;

        const storeIndexes: Record<string, ObjectStoreIndex> = {};
        indexes = indexes ?? {};

        storeIndexes[KEY_INDEX_NAME] = new ObjectStoreIndex(KEY_INDEX_NAME, key, { unique: true });

        for (const name in indexes) {
            const indexArgs = indexes[name];
            const index = new ObjectStoreIndex(name, typeof indexArgs.path === "string" ? [indexArgs.path] : indexArgs.path, { unique: indexArgs.unique });
            storeIndexes[name] = index;
        }

        this.indexes = storeIndexes;
    }

    readonly name: string;
    private readonly key: string[];
    private readonly indexes: Record<string, ObjectStoreIndex>;
    private items: (V | undefined)[] = [];

    getAll(): V[] {
        return this.items.filter(isDefined);
    }

    getByKey(key: KeyValue): V | undefined {
        const items = this.getByIndex(KEY_INDEX_NAME, [key]);

        return items[0];
    }

    getIndexes(): ObjectStoreIndex[] {
        return Object.values(this.indexes);
    }

    getIndex(name: string): ObjectStoreIndex {
        const index = this.indexes[name];

        if (index === void 0) {
            throw new Error(`index not found: ${name}`);
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
            const indexKeys = indexCandidate.getKeyPath();

            if (indexKeys.length !== keyPaths.length) {
                continue;
            }

            if (JSON.stringify(indexKeys.slice().sort()) === keyPathsJson) {
                return indexCandidate;
            }
        }

        throw new Error(`failed to find index matching keyPaths: ${JSON.stringify(keyPaths)}`);
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

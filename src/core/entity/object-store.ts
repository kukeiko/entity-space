import { isDefined } from "../../utils/is-defined.fn";
import { SchemaIndexes, SchemaKey } from "./metadata/schema";
import { IndexValue, ObjectStoreIndex } from "./object-store-index";

type KeyValue = (string | number) | (string | number)[];

// const db: IDBDatabase = {} as any;
// const myStore = db.createObjectStore("foo");
// const myIndex = myStore.createIndex("", "", { multiEntry: true });
// myIndex.get(["foo", 1, [[3]]]);
// myStore.openCursor();
// myStore.delete

/**
 * [todo] copied over from a file that i've last worked on some years ago, so some polish is needed
 * since i've changed my code style quite a bit
 */

// [todo] not happy with various method/variable/type names, revisit.
export class ObjectStore<V = any> {
    constructor(name: string, key: string[], indexes?: SchemaIndexes) {
        this.name = name;
        this.key = key;

        const storeIndexes: Record<string, ObjectStoreIndex> = {};
        indexes = indexes ?? {};

        for (const name in indexes) {
            const indexArgs = indexes[name];
            const index = new ObjectStoreIndex(name, indexArgs.paths, { unique: indexArgs.unique });
            storeIndexes[name] = index;
        }

        this.indexes = storeIndexes;
    }

    private readonly name: string;
    private readonly key: SchemaKey;
    private readonly indexes: Record<string, ObjectStoreIndex>;
    private items: (V | undefined)[] = [];
    private keyIndex = new Map();

    getAll(): V[] {
        return this.items.filter(isDefined);
    }

    getByKey(key: KeyValue): V | undefined {
        const recordIndex = this.getRecordIndexByKey(key);

        if (recordIndex === void 0) {
            return void 0;
        }

        return this.items[recordIndex];
    }

    private getRecordIndexByKey(key: KeyValue): number | undefined {
        let mapOrRecordIndex: Map<any, any> | V | undefined = this.keyIndex;

        if (typeof key === "string" || typeof key === "number") {
            key = [key];
        }

        for (const value of key) {
            mapOrRecordIndex = mapOrRecordIndex?.get(value);

            if (mapOrRecordIndex === void 0) {
                return void 0;
            } else if (typeof mapOrRecordIndex === "number") {
                return mapOrRecordIndex;
            } else if (!(mapOrRecordIndex instanceof Map)) {
                throw new Error(`invalid key: ${key}`);
            }
        }

        return void 0;
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

    readKey(item: V): KeyValue {
        const key: KeyValue = [];

        for (const keyPath of this.key) {
            key.push(this.readStringOrNumberKey(item, keyPath));
        }

        return key;
    }

    // [todo] instead have "insert()", "update()" and "upsert()"
    add(items: any[]): void {
        for (const item of items) {
            const key = this.readKey(item);
            const itemsIndex = this.items.length;
            this.items.push(item);
            this.addToKeyIndex(key, itemsIndex);

            for (const indexName in this.indexes) {
                this.indexes[indexName].add(item, itemsIndex);
            }
        }
    }

    // [todo] not cleaning up indexes on purpose. deleting entry from record array
    // is enough for items to not show up anymore. doing it this way since i guess
    // it is the most performant; and while we do make the record array sparse this way,
    // ii don't suspect deletions happening too often. lets see.
    remove(items: any[]): void {
        for (const item of items) {
            const key = this.readKey(item);
            const recordIndex = this.getRecordIndexByKey(key);

            if (recordIndex !== void 0) {
                delete this.items[recordIndex];
            }
        }
    }

    clear(): void {
        this.keyIndex = new Map();
        this.items = [];

        for (const indexName in this.indexes) {
            this.indexes[indexName].clear();
        }
    }

    private readStringOrNumberKey(item: any, key: string): string | number {
        const parts = key.split(".");
        let value = item;

        for (const part of parts) {
            value = value[part];
        }

        if (typeof value !== "string" && typeof value !== "number") {
            throw new Error(`key "${key}" did not evaluate to a string or number`);
        }

        return value;
    }

    private addToKeyIndex(key: KeyValue, itemsIndex: number): void {
        let map = this.keyIndex;

        if (typeof key === "string" || typeof key === "number") {
            key = [key];
        }

        for (let i = 0; i < key.length; ++i) {
            const keyPrimitiveValue = key[i];

            if (i === key.length - 1) {
                map.set(keyPrimitiveValue, itemsIndex);
            } else {
                if (!map.has(keyPrimitiveValue)) {
                    map.set(keyPrimitiveValue, new Map());
                }

                map = map.get(keyPrimitiveValue);
            }
        }
    }
}

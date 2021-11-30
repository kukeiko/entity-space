import { ObjectStoreIndex } from "./object-store-index";

export class ObjectStore<K, V> {
    constructor(args: { getKey: (item: V) => K; indexes?: { [index: string]: (item: V) => any } }) {
        this.getKey = args.getKey;

        for (let index in args.indexes) {
            this.indexes.set(
                index,
                new ObjectStoreIndex<K, V>({
                    getIndexValue: args.indexes[index],
                    getKey: args.getKey,
                    name: index,
                })
            );
        }
    }

    readonly getKey: (item: V) => K;

    private readonly entities = new Map<K, V>();
    private readonly indexes = new Map<string, ObjectStoreIndex<K, V>>();

    all(): V[] {
        return Array.from(this.entities.values());
    }

    byKey(key: K): V | undefined {
        return this.entities.get(key);
    }

    byKeys(keys: ArrayLike<K>): V[] {
        let k: K;
        let items: V[] = [];

        for (let i = 0; i < keys.length; ++i) {
            k = keys[i];
            let v = this.byKey(k);
            if (v != null) items.push(v);
        }

        return items;
    }

    private byIndexInternal(index: string, value: any): Map<K, V> {
        let idx = this.indexes.get(index);
        if (idx == null) throw `index ${index} doesn't exist`;

        return idx.get(value);
    }

    byIndex(index: string, value: string | number): V[] {
        let ix = this.indexes.get(index);
        if (ix == null) throw `index ${index} doesn't exist`;

        return ix.getAsArray(value);
    }

    byIndexes(values: { [key: string]: number | string }): V[] {
        let indexes: string[] = [];
        let items = new Map<K, V>();
        let itemsPerIndex = new Map<string, Map<K, V>>();

        for (let key in values) {
            itemsPerIndex.set(key, this.byIndexInternal(key, values[key]));
            indexes.push(key);
        }

        // todo: i think amount of loops can be drastically reduced by deleting non-matches during iteration
        itemsPerIndex.forEach((map, index) => {
            let otherIndexes = indexes.filter(i => i != index);

            map.forEach((item, key) => {
                if (!items.has(key) && otherIndexes.every(i => itemsPerIndex.get(i)?.has(key))) {
                    items.set(key, item);
                }
            });
        });

        return Array.from(items.values());
    }

    add(items: V[]): void {
        let length = items.length;
        let item: V;

        for (let i = 0; i < length; ++i) {
            item = items[i];
            if (!item) continue;

            let key = this.getKey(item);
            if (key == null) throw `can't add item to cache with undefined/null key: ${JSON.stringify(item)}`;

            let existing = this.entities.get(key);

            this.entities.set(key, item);
            this.indexes.forEach(i => i.update(item, existing));
        }
    }

    removeByIndex(index: string, value: string | number): void {
        let ix = this.indexes.get(index);
        if (ix == null) throw `index ${index} doesn't exist`;

        ix.get(value).forEach(x => this.entities.delete(this.getKey(x)));
        ix.clear(value);
    }

    remove(items: V[]): void {
        for (const item of items) {
            const cached = this.entities.get(this.getKey(item));

            if (!cached) {
                continue;
            }

            this.entities.delete(this.getKey(item));
            this.indexes.forEach(index => index.remove(cached));
        }
    }

    clear(): void {
        this.entities.clear();
        this.indexes.forEach(index => index.clear());
    }
}

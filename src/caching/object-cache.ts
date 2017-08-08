import { ArrayLike, ToStringable } from "../util";

/**
 * Store and access objects via primary key & indexes. The ObjectCache is basically a Map on steroids
 * that is used to cache entities of a single type and retrieve them by their primary key or
 * a combination of indexes.
 */
// todo: optimize via kill forEach where possible + getKey() => keyName
export class ObjectCache<K, V> {
    readonly getKey: (item: V) => K;
    private _pkMap = new Map<K, V>();
    private _indexes = new Map<string, ObjectCache.Index<K, V>>();

    get size(): number {
        return this._pkMap.size;
    }

    constructor(args: {
        getKey: (item: V) => K;
        indexes?: { [index: string]: (item: V) => any };
    }) {
        this.getKey = args.getKey;

        for (let index in args.indexes) {
            this._indexes.set(index, new ObjectCache.Index<K, V>({
                getIndexValue: args.indexes[index],
                getKey: args.getKey,
                name: index
            }));
        }
    }

    all(into?: Map<K, V>): Map<K, V> {
        into = into || new Map<K, V>();
        this._pkMap.forEach((v, k) => into.set(k, v));

        return into;
    }

    allAsArray(into?: V[]): V[] {
        into = into || [];
        this._pkMap.forEach(v => into.push(v));

        return into;
    }

    byKey(key: K): V {
        return this._pkMap.get(key) || null;
    }

    byKeys(keys: ArrayLike<K>, into?: Map<K, V>): Map<K, V> {
        let map = into || new Map<K, V>();
        let k: K;

        for (let i = 0; i < keys.length; ++i) {
            k = keys[i];
            let v = this.byKey(k);
            if (v != null) map.set(k, v);
        }

        return map;
    }

    byKeysAsArray(keys: ArrayLike<K>): V[] {
        let k: K;
        let items: V[] = [];

        for (let i = 0; i < keys.length; ++i) {
            k = keys[i];
            let v = this.byKey(k);
            if (v != null) items.push(v);
        }

        return items;
    }

    byIndex(index: string, value: any): Map<K, V> {
        let idx = this._indexes.get(index);
        if (idx == null) throw `index ${index} doesn't exist`;

        return idx.get(value);
    }

    byIndexAsArray(index: string, value: any): V[] {
        let ix = this._indexes.get(index);
        if (ix == null) throw `index ${index} doesn't exist`;

        return ix.getAsArray(value);
    }

    byIndexes(indexes: { [key: string]: ToStringable }): Map<K, V> {
        let indexArray = new Array<string>();
        let items = new Map<K, V>();
        let itemsPerIndex = new Map<string, Map<K, V>>();

        for (let key in indexes) {
            itemsPerIndex.set(key, this.byIndex(key, indexes[key]));
            indexArray.push(key);
        }

        // todo: i think amount of loops can be drastically reduced by deleting non-matches during iteration
        itemsPerIndex.forEach((map, index) => {
            let otherIndexes = indexArray.filter(i => i != index);

            map.forEach((item, key) => {
                if (!items.has(key) && otherIndexes.every(i => itemsPerIndex.get(i).has(key))) {
                    items.set(key, item);
                }
            });
        });

        return items;
    }

    byIndexesAsArray(indexes: { [key: string]: ToStringable }): V[] {
        return Array.from(this.byIndexes(indexes).values());
    }

    add(items: V[]): void {
        let length = items.length;
        let item: V = null;

        for (let i = 0; i < length; ++i) {
            item = items[i];
            if (!item) continue;

            let key = this.getKey(item);
            if (key == null) throw `can't add item to cache with undefined/null key: ${JSON.stringify(item)}`;

            let existing = this._pkMap.get(key);

            this._pkMap.set(key, item);
            this._indexes.forEach(i => i.update(item, existing));
        }
    }

    removeByIndex(index: string, value: ToStringable): void {
        let ix = this._indexes.get(index);
        if (ix == null) throw `index ${index} doesn't exist`;

        ix.get(value).forEach(x => this._pkMap.delete(this.getKey(x)));
        ix.clear(value);
    }

    remove(items: V[]): void {
        let length = items.length;
        let item: V = null;
        let cached: V = null;

        for (let i = 0; i < length; ++i) {
            item = items[i];
            cached = this._pkMap.get(this.getKey(item));
            if (!cached) continue;

            this._pkMap.delete(this.getKey(item));
            this._indexes.forEach(i => i.remove(cached));
        }
    }

    clear(): void {
        this._pkMap = new Map<K, V>();
        this._indexes.forEach(index => index.clear());
    }
}

export module ObjectCache {
    export class Index<K, V> {
        readonly name: string = null;
        readonly getIndexValue: (item: V) => any;
        readonly getKey: (item: V) => K;

        private _maps = new Map<any, Map<K, V>>();
        private _pkMaps = new Map<K, Map<K, V>>();

        constructor(args: {
            getIndexValue: (item: V) => any;
            getKey: (item: V) => K;
            name: string;
        }) {
            this.getIndexValue = args.getIndexValue;
            this.getKey = args.getKey;
            this.name = args.name;
        }

        /**
         * Returns a copy of the items stored for the given index value,
         * with the key being the primary key of an item.
         */
        get(value: any): Map<K, V> {
            let map = this._maps.get(value);
            return map ? new Map<K, V>(map) : new Map<K, V>();
        }

        getAsArray(value: any): V[] {
            let map = this._maps.get(value);
            if (!map) return [];

            return Array.from(map.values());
        }

        clear(): void;
        clear(value: ToStringable): void;
        clear(...args: any[]): void {
            if (args.length == 0) {
                this._maps.clear();
                this._pkMaps.clear();
            } else {
                let map = this._maps.get(args[0]);

                if (map != null) {
                    map.clear();
                    let keys: K[] = [];
                    this._pkMaps.forEach((m, k) => m == map ? keys.push(k) : null);
                    keys.forEach(k => this._pkMaps.delete(k));
                }
            }
        }

        update(newItem: V): void;
        update(newItem: V, oldItem?: V): void;
        update(...args: any[]): void {
            if (args[1] == null) {
                let item = args[0] as V;
                let value = this.getIndexValue(item);
                if (value == null) return;

                let map = this._maps.get(value);

                if (map == null) {
                    map = new Map<K, V>();
                    this._maps.set(value, map);
                }

                let key = this.getKey(item);
                map.set(key, item);
                this._pkMaps.set(key, map);
            } else {
                let [newItem, oldItem] = <V[]>[args[0], args[1]];

                let key = this.getKey(newItem);
                if (key != this.getKey(oldItem)) {
                    throw "can't update indexes for 2 items that have different primary keys";
                }

                let [newValue, oldValue] = [this.getIndexValue(newItem), this.getIndexValue(oldItem)];
                let [newMap, oldMap] = [this._maps.get(newValue), this._maps.get(oldValue)];

                if (oldMap != null) {
                    oldMap.delete(key);
                    this._pkMaps.delete(key);
                }

                if (newValue != null) {
                    if (newMap == null) {
                        newMap = new Map<K, V>();
                        this._maps.set(newValue, newMap);
                    }

                    newMap.set(key, newItem);
                    this._pkMaps.set(key, newMap);
                }
            }
        }

        remove(item: V): void {
            let key = this.getKey(item);
            if (key == null) return;

            let map = this._maps.get(this.getIndexValue(item));
            if (map == null) return;

            map.delete(key);
            this._pkMaps.delete(key);
        }
    }
}

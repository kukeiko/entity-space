/**
 * Store and access objects via primary key & indexes. The ObjectCache is basically a Map on steroids
 * that is used to cache entities of a single type and retrieve them by their primary key or
 * a combination of indexes.
 */
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

    get(key: K): V {
        return this._pkMap.get(key) || null;
    }

    getMany(keys: K[]): Map<K, V> {
        let map = new Map<K, V>();
        keys.forEach(k => {
            let v = this.get(k);
            if (v != null) map.set(k, v);
        });

        return map;
    }

    all(): Map<K, V> {
        let map = new Map<K, V>();
        this._pkMap.forEach((v, k) => map.set(k, v));

        return map;
    }

    byIndex(index: string, value: any): Map<K, V> {
        let ix = this._indexes.get(index);
        if (ix == null) throw `index ${index} doesn't exist`;

        return ix.get(value);
    }

    byIndexes(indexes: { [key: string]: Object }): Map<K, V> {
        let indexArray = new Array<string>();
        let items = new Map<K, V>();
        let itemsPerIndex = new Map<string, Map<K, V>>();

        for (let key in indexes) {
            itemsPerIndex.set(key, this.byIndex(key, indexes[key]));
            indexArray.push(key);
        }

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

    removeByIndex(index: string, value: any): void {
        let ix = this._indexes.get(index);
        if (ix == null) throw `index ${index} doesn't exist`;

        ix.clear(value);
    }

    remove(item: V): void {
        this._pkMap.delete(this.getKey(item));
        this._indexes.forEach(i => i.remove(item));
    }

    add(item: V): V {
        let key = this.getKey(item);
        if (key == null) throw `can't add item to cache with undefined/null key: ${JSON.stringify(item)}`;

        let existing = this._pkMap.get(key);

        this._pkMap.set(key, item);
        this._indexes.forEach(i => i.update(item, existing));

        return item;
    }

    addMany(items: V[]): Map<K, V> {
        let map = new Map<K, V>();

        items.forEach(i => {
            this.add(i);
            map.set(this.getKey(i), i);
        });

        return map;
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

        clear(): void;
        clear(value?: any): void;
        clear(...args: any[]): void {
            if (args.length == 0) {
                this._maps.clear();
            } else {
                let map = this._maps.get(args[0]);
                if (map != null) {
                    map.clear();
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

                map.set(this.getKey(item), item);
            } else {
                let [newItem, oldItem] = <V[]>[args[0], args[1]];

                let key = this.getKey(newItem);
                if (key != this.getKey(oldItem)) {
                    throw "can't update indexes for 2 items that have different primary keys";
                }

                let [newValue, oldValue] = [this.getIndexValue(newItem), this.getIndexValue(oldItem)];
                let [newMap, oldMap] = [this._maps.get(newValue), this._maps.get(oldValue)];

                if (oldMap != null) oldMap.delete(key);

                if (newMap == null && newValue != null) {
                    newMap = new Map<K, V>();
                    this._maps.set(newValue, newMap);
                }

                if (newValue != null) {
                    newMap.set(key, newItem);
                }
            }
        }

        remove(item: V): void {
            let key = this.getKey(item);
            if (key == null) return;

            let map = this._maps.get(this.getIndexValue(item));
            if (map == null) return;

            map.delete(key);
        }
    }
}

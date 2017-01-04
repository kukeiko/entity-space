// todo: unit test this sucker
export class Cache<K, V> {
    private _pkMap = new Map<K, V>();
    private _getKey: (item: V) => K;
    private _indexes = new Map<string, Cache.Index<K, V>>();

    constructor(args: {
        getter: (item: V) => K;
        indexes?: { [index: string]: (item: V) => any };
    }) {
        this._getKey = args.getter;

        for (let index in args.indexes) {
            this._indexes.set(index, new Cache.Index<K, V>({
                getter: args.indexes[index],
                keyGetter: args.getter,
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
        this._pkMap.delete(this._getKey(item));
        this._indexes.forEach(i => i.remove(item));
    }

    add(item: V): V {
        let key = this._getKey(item);
        if (key == null) throw "can't add item to cache with undefined/null key";

        let existing = this._pkMap.get(key);

        this._pkMap.set(key, item);
        this._indexes.forEach(i => i.update(item, existing));

        return item;
    }

    addMany(items: V[]): Map<K, V> {
        let map = new Map<K, V>();

        items.forEach(i => {
            this.add(i);
            map.set(this._getKey(i), i);
        });

        return map;
    }
}

export module Cache {
    export class Index<K, V> {
        private _name: string;
        get name(): string { return this._name; }

        private _getter: (item: V) => any;
        private _keyGetter: (item: V) => K;
        private _maps = new Map<any, Map<K, V>>();

        constructor(args: {
            getter: (item: V) => any;
            keyGetter: (item: V) => K;
            name: string;
        }) {
            this._getter = args.getter;
            this._keyGetter = args.keyGetter;
            this._name = args.name;
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
                let value = this._getter(item);
                if (value == null) return;

                let map = this._maps.get(value);

                if (map == null) {
                    map = new Map<K, V>();
                    this._maps.set(value, map);
                }

                map.set(this._keyGetter(item), item);
            } else {
                let [newItem, oldItem] = <V[]>[args[0], args[1]];

                let key = this._keyGetter(newItem);
                if (key != this._keyGetter(oldItem)) {
                    throw "can't update indexes for 2 items that have different primary keys";
                }

                let [newValue, oldValue] = [this._getter(newItem), this._getter(oldItem)];
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
            let key = this._keyGetter(item);
            if (key == null) return;

            let map = this._maps.get(this._getter(item));
            if (map == null) return;

            map.delete(key);
        }
    }
}

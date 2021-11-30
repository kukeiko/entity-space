export class ObjectStoreIndex<K, V> {
    readonly name: string;
    readonly getIndexValue: (item: V) => any;
    readonly getKey: (item: V) => K;

    private _maps = new Map<any, Map<K, V>>();
    private _pkMaps = new Map<K, Map<K, V>>();

    constructor(args: { getIndexValue: (item: V) => any; getKey: (item: V) => K; name: string }) {
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
    clear(value: any): void;
    clear(...args: any[]): void {
        if (args.length == 0) {
            this._maps.clear();
            this._pkMaps.clear();
        } else {
            let map = this._maps.get(args[0]);

            if (map != null) {
                map.clear();
                let keys: K[] = [];
                this._pkMaps.forEach((m, k) => (m == map ? keys.push(k) : null));
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

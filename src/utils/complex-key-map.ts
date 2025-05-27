import { isDefined } from "./is-defined.fn";
import { assertValidPaths, Path, readPath } from "./path";

/**
 * Allows storage, retrieval, update and deletion of values identified by complex keys.
 * A complex key must be an object with one or more primitive (boolean, number, string, undefined, null) properties.
 * Those properties can be deeply nested and are defined when constructing the map.
 */
export class ComplexKeyMap<Key extends Record<string, any> = Record<string, any>, Value = Key> {
    /**
     * @param keyPropertyPaths One or more strings, where each string points to a property. Use dots for nested properties.
     */
    constructor(keyPropertyPaths: readonly Path[]) {
        let leadingPaths: Path[], lastPath: Path;

        assertValidPaths(keyPropertyPaths);

        if (keyPropertyPaths.length === 1) {
            leadingPaths = [];
            lastPath = keyPropertyPaths[0];
        } else {
            leadingPaths = keyPropertyPaths.slice(0, -1);
            lastPath = keyPropertyPaths[keyPropertyPaths.length - 1];
        }

        this.leadingPaths = leadingPaths;
        this.lastPath = lastPath;
    }

    protected readonly map = new Map<unknown, unknown>();
    protected readonly leadingPaths: Path[];
    protected readonly lastPath: Path;

    clear(): void {
        this.map.clear();
    }

    /**
     * Retrieve a value.
     * @param key The complex key identifying the value you want returned.
     * @param customKeyPropertyPaths Use these paths to read the key property values instead of the keyPropertyPaths defined during construction.
     * @returns The value identified by the given complex key, or undefined if not found.
     */
    get(key: Key | Record<string, any>, customKeyPropertyPaths?: readonly Path[]): Value | undefined {
        const [leadingPaths, lastPath] = this.#pickPaths(customKeyPropertyPaths);
        const valueMap = this.#getValueMap(key, leadingPaths);

        if (!valueMap) {
            return undefined;
        }

        return valueMap.get(readPath(lastPath, key));
    }

    /**
     * Retrieve all stored values.
     * @returns All stored values.
     */
    getAll(): Value[] {
        const valueMaps = this.#getAllValueMaps();
        const values: Value[] = [];

        for (const map of valueMaps) {
            for (const value of map.values()) {
                values.push(value);
            }
        }

        return values;
    }

    /**
     * Retrieve many values.
     * @param keys The complex keys identifying the values you want returned.
     * @returns The values identified by the given complex keys.
     */
    getMany(keys: Key[]): Value[] {
        return keys.map(entity => this.get(entity)).filter(isDefined);
    }

    /**
     * Store a value.
     * @param key The complex key identifying the value you want stored.
     * @param value The value you want stored.
     * @param update A callback invoked when a value for the given key already exists which should return the value to be stored.
     * @returns Nothing.
     */
    set(key: Key, value: Value, update?: (previous: Value, current: Value) => Value): void {
        const valueMap = this.#getOrCreateValueMap(key);
        const lastKey = readPath(this.lastPath, key);

        if (update && valueMap.has(lastKey)) {
            const updated = update(valueMap.get(lastKey)!, value);

            if (updated === value) {
                return;
            }

            value = updated;
        }

        valueMap.set(readPath(this.lastPath, key), value);
    }

    setMany(keys: Key[], values: Value[], update?: (previous: Value, current: Value) => Value): void {
        keys.forEach((key, index) => this.set(key, values[index], update));
    }

    delete(key: Key): boolean {
        const valueMap = this.#getValueMap(key);

        if (!valueMap) {
            return false;
        }

        return valueMap.delete(readPath(this.lastPath, key));
    }

    #getValueMap(key: Key | Record<string, any>, leadingPaths = this.leadingPaths): Map<unknown, Value> | undefined {
        let map = this.map;

        for (const path of leadingPaths) {
            const leadingKey = readPath(path, key);

            if (!map.has(leadingKey)) {
                return undefined;
            }

            map = map.get(leadingKey) as Map<unknown, unknown>;
        }

        return map as Map<unknown, Value>;
    }

    #getOrCreateValueMap(key: Key | Record<string, any>, leadingPaths = this.leadingPaths): Map<unknown, Value> {
        let map = this.map;

        for (const path of leadingPaths) {
            const leadingKey = readPath(path, key);
            map = this.#getOrSet(map, leadingKey, () => new Map());
        }

        return map as Map<unknown, Value>;
    }

    #getAllValueMaps(): Map<unknown, Value>[] {
        let maps = [this.map];

        for (const _ of this.leadingPaths) {
            let nextMaps: Map<unknown, unknown>[] = [];

            for (const map of maps) {
                for (const value of map.values()) {
                    nextMaps.push(value as Map<unknown, unknown>);
                }
            }

            maps = nextMaps;
        }

        return maps as Map<unknown, Value>[];
    }

    #pickPaths(customKeyPropertyPaths?: readonly Path[]): [Path[], Path] {
        let leadingPaths = this.leadingPaths;
        let lastPath = this.lastPath;

        if (customKeyPropertyPaths) {
            assertValidPaths(customKeyPropertyPaths);
            leadingPaths = customKeyPropertyPaths.slice(0, -1);
            lastPath = customKeyPropertyPaths[customKeyPropertyPaths.length - 1];

            if (leadingPaths.length !== this.leadingPaths.length || lastPath === undefined) {
                throw new Error("custom path must have same length as original path");
            }
        }

        return [leadingPaths, lastPath];
    }

    #getOrSet<K, V>(map: Map<K, any>, key: K, createValue: () => V): V {
        if (!map.has(key)) {
            const value = createValue();
            map.set(key, value);

            return value;
        }

        return map.get(key)!;
    }
}

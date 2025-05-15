export function mutateMapEntry<K, V>(map: Map<K, V>, key: K, update: (value: V) => unknown, defaultValue: V): void {
    if (!map.has(key)) {
        map.set(key, defaultValue);
    }

    update(map.get(key)!);
}

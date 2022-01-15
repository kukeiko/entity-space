export function toMap<K, V>(items: V[], keySelector: (item: V) => K): Map<K, V> {
    const map = new Map<K, V>();

    for (const item of items) {
        map.set(keySelector(item), item);
    }

    return map;
}

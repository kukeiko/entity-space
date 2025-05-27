export function entryValueIs<K, V, T extends V>(
    predicate: (value: V) => value is T,
): (entry: [K, V]) => entry is [K, T] {
    return (entry: [K, V]): entry is [K, T] => predicate(entry[1]);
}

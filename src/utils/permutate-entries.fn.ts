export function permutateEntries<T>(entries: [string, T[]][], aggregated: Record<string, T> = {}): Record<string, T>[] {
    if (entries.length === 0) {
        return [aggregated];
    }

    let allAggregated: any[] = [];
    let [key, shards] = entries[0];
    entries = entries.slice(1);
    aggregated = { ...aggregated };

    for (const shard of shards) {
        let nextAggregated = { ...aggregated, [key]: shard };
        allAggregated.push(...permutateEntries(entries, nextAggregated));
    }

    return allAggregated;
}
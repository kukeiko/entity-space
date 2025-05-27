import type { Unbox } from "./types";

type Permutated<T> = { [K in keyof T]: Unbox<T[K]> };

function permutateEntriesCore<T>(entries: [string, T[]][], aggregated: Record<string, T> = {}): Record<string, T>[] {
    if (entries.length === 0) {
        return [aggregated];
    }

    let allAggregated: any[] = [];
    let [key, shards] = entries[0];

    if (!Array.isArray(shards)) {
        shards = [shards];
    }

    entries = entries.slice(1);
    aggregated = { ...aggregated };

    for (const shard of shards) {
        let nextAggregated = { ...aggregated, [key]: shard };
        allAggregated.push(...permutateEntriesCore(entries, nextAggregated));
    }

    return allAggregated;
}

export function permutateEntries<T extends Record<string, any>>(entries: T): Permutated<T>[] {
    return permutateEntriesCore(Object.entries(entries), {}) as Permutated<T>[];
}

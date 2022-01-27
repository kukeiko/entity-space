import { Unbox } from "./types/unbox";

function permutateEntriesInternal<T>(
    entries: [string, T[]][],
    aggregated: Record<string, T> = {}
): Record<string, T>[] {
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
        allAggregated.push(...permutateEntriesInternal(entries, nextAggregated));
    }

    return allAggregated;
}

type Permutated<T> = { [K in keyof T]: Unbox<T[K]> };

export function permutateEntries<T>(entries: T, aggregated: Partial<T> = {}): Permutated<T>[] {
    const entries_ = Object.entries(entries);

    return permutateEntriesInternal(entries_, aggregated) as any;
}

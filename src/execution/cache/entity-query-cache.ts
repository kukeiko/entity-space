import { EntityQuery, EntitySchema, isReadonlyCriterion, subtractQueries, subtractQuery } from "@entity-space/elements";
import { partition } from "lodash";
import { EntityQueryTracing } from "../entity-query-tracing";

export class EntityQueryCache {
    constructor(tracing: EntityQueryTracing) {
        this.#tracing = tracing;
    }

    readonly #tracing: EntityQueryTracing;
    readonly #cache = new Map<string, [string, EntityQuery][]>();

    addQuery(query: EntityQuery): void {
        const now = new Date(Date.now()).toISOString();
        const cacheKey = query.getSchema().getName();
        const cachedTimestampedQueries = this.#cache.get(cacheKey) ?? [];
        const nextCache: [string, EntityQuery][] = [[now, query]];

        for (const [timestamp, cachedQuery] of cachedTimestampedQueries) {
            const subtracted = subtractQuery(cachedQuery, query);

            if (subtracted === false) {
                nextCache.push([timestamp, cachedQuery]);
            } else if (subtracted !== true) {
                for (const cachedQuery of subtracted) {
                    nextCache.push([timestamp, cachedQuery]);
                }
            }
        }

        this.#cache.set(cacheKey, nextCache);
    }

    subtractQuery(query: EntityQuery, maxTimestamp?: string): EntityQuery[] | boolean {
        const cacheKey = query.getSchema().getName();
        let cachedTimestampedQueries = this.#cache.get(cacheKey) ?? [];

        if (maxTimestamp !== undefined) {
            cachedTimestampedQueries = cachedTimestampedQueries.filter(([timestamp]) => timestamp > maxTimestamp);
        }

        const cachedQueries = cachedTimestampedQueries.map(([_, cachedQuery]) => cachedQuery);

        return subtractQueries([query], cachedQueries);
    }

    getQueries(): readonly EntityQuery[] {
        return Array.from(this.#cache.values())
            .flat()
            .map(([_, cachedQuery]) => cachedQuery);
    }

    evictNonReadonlyQueries(schema: EntitySchema): void {
        const cacheKey = schema.getName();

        const [kept, evicted] = partition(this.#cache.get(cacheKey) ?? [], ([_, cachedQuery]) => {
            const criterion = cachedQuery.getCriterion();
            return criterion === undefined || isReadonlyCriterion(cachedQuery.getSchema(), criterion);
        });

        this.#tracing.queriesEvictedFromCache(evicted.map(([_, query]) => query));
        this.#cache.set(cacheKey, kept);
    }
}

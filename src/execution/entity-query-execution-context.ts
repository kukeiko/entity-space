import { EntityQuery } from "@entity-space/elements";
import { ExecutionContext } from "@entity-space/utils";
import { EntityCache } from "./cache/entity-cache";

export class EntityQueryExecutionContext extends ExecutionContext {
    constructor(
        query: EntityQuery,
        cache: EntityCache,
        options?: { readFromCache?: boolean; loadFromSource?: boolean; writeToCache?: boolean; maxTimestamp?: string },
    ) {
        super(query.toString());
        this.#query = query;
        this.#cache = cache;
        this.#readFromCache = options?.readFromCache ?? false;
        this.#writeToCache = options?.writeToCache ?? false;
        this.#loadFromSource = options?.loadFromSource ?? false;
        this.#maxTimestamp = options?.maxTimestamp;
    }

    readonly #query: EntityQuery;
    readonly #cache: EntityCache;
    readonly #readFromCache: boolean;
    readonly #writeToCache: boolean;
    readonly #loadFromSource: boolean;
    readonly #maxTimestamp?: string;

    getQuery(): EntityQuery {
        return this.#query;
    }

    getCache(): EntityCache {
        return this.#cache;
    }

    readFromCache(): boolean {
        return this.#readFromCache;
    }

    writeToCache(): boolean {
        return this.#writeToCache;
    }

    loadFromSource(): boolean {
        return this.#loadFromSource;
    }

    getMaxTimestamp(): string | undefined {
        return this.#maxTimestamp;
    }
}

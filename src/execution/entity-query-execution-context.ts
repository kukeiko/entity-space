import { EntityQuery } from "@entity-space/elements";
import { EntityCache } from "./cache/entity-cache";

export class EntityQueryExecutionContext {
    constructor(
        query: EntityQuery,
        cache: EntityCache,
        options?: { readFromCache?: boolean; loadFromSource?: boolean; writeToCache?: boolean },
    ) {
        this.#query = query;
        this.#cache = cache;
        this.#readFromCache = options?.readFromCache ?? false;
        this.#writeToCache = options?.writeToCache ?? false;
        this.#loadFromSource = options?.loadFromSource ?? false;
    }

    readonly #query: EntityQuery;
    readonly #cache: EntityCache;
    readonly #readFromCache: boolean;
    readonly #writeToCache: boolean;
    readonly #loadFromSource: boolean;

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
}

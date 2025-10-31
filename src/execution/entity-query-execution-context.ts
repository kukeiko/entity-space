import { EntityCache } from "./cache/entity-cache";

export class EntityQueryExecutionContext {
    constructor(
        cache: EntityCache,
        options?: { readFromCache?: boolean; loadFromSource?: boolean; writeToCache?: boolean },
    ) {
        this.#cache = cache;
        this.#readFromCache = options?.readFromCache ?? false;
        this.#writeToCache = options?.writeToCache ?? false;
        this.#loadFromSource = options?.loadFromSource ?? false;
    }

    readonly #cache: EntityCache;
    readonly #readFromCache: boolean;
    readonly #writeToCache: boolean;
    readonly #loadFromSource: boolean;

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

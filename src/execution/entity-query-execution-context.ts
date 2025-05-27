import { EntityCache } from "./cache/entity-cache";

export class EntityQueryExecutionContext {
    constructor(cache: EntityCache, options?: { readFromCache?: boolean; loadFromSource?: boolean }) {
        this.#cache = cache;
        this.#readFromCache = options?.readFromCache ?? false;
        this.#loadFromSource = options?.loadFromSource ?? false;
    }

    readonly #cache: EntityCache;
    readonly #readFromCache: boolean;
    readonly #loadFromSource: boolean;

    getCache(): EntityCache {
        return this.#cache;
    }

    readFromCache(): boolean {
        return this.#readFromCache;
    }

    loadFromSource(): boolean {
        return this.#loadFromSource;
    }
}

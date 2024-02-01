import { IEntityCache } from "./entity-cache.interface";

export class EntityQueryExecutionContext {
    constructor(private readonly streamCache: IEntityCache, private readonly cache: IEntityCache) {}

    fromCacheOnly = false;

    getStreamCache(): IEntityCache {
        return this.streamCache;
    }

    getCache(): IEntityCache {
        return this.cache;
    }
}

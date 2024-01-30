import { IEntityCache } from "./entity-cache.interface";

export class EntityQueryExecutionContext {
    constructor(private readonly streamCache: IEntityCache) {}

    getStreamCache(): IEntityCache {
        return this.streamCache;
    }
}

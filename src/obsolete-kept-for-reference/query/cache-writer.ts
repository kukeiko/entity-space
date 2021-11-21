import { QueryResult } from "./query-result";

export interface CacheWriter {
    writeToCache(result: QueryResult): void;
}

import { Query } from "./query";
import { Instance } from "./instance";

export interface CacheReader {
    readFromCache(query: Query): Instance[];
}

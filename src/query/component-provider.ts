import { Class } from "../utils";
import { Query } from "./query";
import { QueryTranslator } from "./query-translator";
import { PayloadHydrator } from "./payload-hydrator";
import { CacheWriter } from "./cache-writer";
import { CacheReader } from "./cache-reader";

export interface ComponentProvider {
    getTranslator(query: Query): QueryTranslator;
    getHydrator(model: Class): PayloadHydrator;
    getCacheWriter?(): CacheWriter;
    getCacheReader?(): CacheReader;
}

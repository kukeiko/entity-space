import { Entity } from "../../entity";
import { InMemoryEntityDatabase } from "../../entity/in-memory-entity-database";
import { Query } from "../query";
import { QueryStream } from "./query-stream";

// [todo] properly name this
export interface IEntitySource_V2 {
    // [todo] properly name this
    query_v2<T extends Entity = Entity>(queries: Query[], database: InMemoryEntityDatabase): QueryStream<T>;
}

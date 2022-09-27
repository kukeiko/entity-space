import { Entity } from "../../entity";
import { InMemoryEntityDatabase } from "../../entity/in-memory-entity-database";
import { Query } from "../query";
import { QueryStream } from "./query-stream";

export interface IEntitySource_V2 {
    query_v2<T extends Entity = Entity>(queries: Query<T>[], database: InMemoryEntityDatabase): QueryStream<T>;
}

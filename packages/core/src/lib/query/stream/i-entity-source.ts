import { Entity } from "@entity-space/common";
import { InMemoryEntityDatabase } from "../../entity/in-memory-entity-database";
import { Query } from "../query";
import { QueryStream } from "./query-stream";

export interface IEntitySource {
    // [todo] what bothers me a bit is that data is loaded into database, and consumer
    // has to then query database on their own. good for EntitySourceGateway, bad for
    // other consumers who just want the data.
    query$<T extends Entity = Entity>(queries: Query[], database: InMemoryEntityDatabase): QueryStream<T>;
}

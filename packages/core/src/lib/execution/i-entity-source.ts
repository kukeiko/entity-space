import { Entity } from "@entity-space/common";
import { IEntityDatabase } from "../entity/i-entity-database";
import { Query } from "../query/query";
import { QueryStream } from "./query-stream";

export interface IEntitySource {
    // [todo] what bothers me a bit is that data is loaded into database, and consumer
    // has to then query database on their own. good for EntitySourceGateway, bad for
    // other consumers who just want the data.
    // [solution] consumer won't consume source, but instead something else that does the job for them.
    query$<T extends Entity = Entity>(queries: Query[], database: IEntityDatabase): QueryStream<T>;
}

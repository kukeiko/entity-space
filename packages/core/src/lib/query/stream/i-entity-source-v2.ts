import { Entity } from "../../entity";
import { Query } from "../query";
import { QueryStream } from "./query-stream";

export interface IEntitySource_V2 {
    query_v2<T extends Entity = Entity>(queries: Query<T>[]): QueryStream<T>;
}

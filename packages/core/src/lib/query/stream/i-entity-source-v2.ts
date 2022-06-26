import { Observable } from "rxjs";
import { Entity } from "../../entity";
import { Query } from "../query";
import { QueryStream } from "./query-stream";
import { QueryStreamPacket } from "./query-stream-packet";

export interface IEntitySource_V2 {
    query<T extends Entity = Entity>(queries: Query<T>[]): QueryStream<T>;
}

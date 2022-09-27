import { Observable } from "rxjs";
import { Entity } from "../../entity";
import { QueryStreamPacket } from "./query-stream-packet";

export type QueryStream<T = Entity> = Observable<QueryStreamPacket<T>>;

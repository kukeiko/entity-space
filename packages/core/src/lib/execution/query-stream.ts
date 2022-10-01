import { Entity } from "@entity-space/common";
import { Observable } from "rxjs";
import { QueryStreamPacket } from "./query-stream-packet";

export type QueryStream<T = Entity> = Observable<QueryStreamPacket<T>>;

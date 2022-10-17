import { Entity } from "@entity-space/common";
import { Observable } from "rxjs";
import { QueryStreamPacket } from "./query-stream-packet";

export type QueryStream<T extends Entity = Entity> = Observable<QueryStreamPacket<T>>;

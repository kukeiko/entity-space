import { Observable } from "rxjs";
import { QueryStreamPacket } from "./query-stream-packet";

export type QueryStream<T> = Observable<QueryStreamPacket<T>>;

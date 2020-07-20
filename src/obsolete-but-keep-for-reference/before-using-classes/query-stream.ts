import { Observable } from "rxjs";
import { Query } from "./query";
import { QueryResultPacket } from "./query-result-packet";

export interface QueryStream<Q extends Query = Query> {
    target?: Q;
    open$(): Observable<QueryResultPacket<Q>>;
}

import { Query } from "./query";
import { QueryResult } from "./query-result";

export interface QueryResultPacket<Q extends Query = Query> extends QueryResult<Q> {
    open: Q[];
    /**
     * Failed queries are those that could not be executed due to system failure (as opposed to results just not being found).
     */
    failed: Q[];
}

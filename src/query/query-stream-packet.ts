import { Query } from "./query";
import { QueryResult } from "./query-result";

export interface QueryStreamPacket<Q extends Query = Query> extends QueryResult<Q> {
    /**
     * Queries that are yet to be delivered by the stream.
     */
    open: Q[];

    /**
     * Failed queries are those that could not be executed due to system failure (as opposed to results just not being found).
     */
    failed: Q[];
}

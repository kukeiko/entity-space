import { QueryResult } from "./query-result";
import { Query } from "./query";

export interface QueryStreamPacket extends QueryResult {
    /**
     * Queries that are yet to be resolved by the stream.
     */
    open: Query[];

    /**
     * Failed queries are those that could not be executed due to system failure (as opposed to results just not being found).
     */
    failed: Query[];
}

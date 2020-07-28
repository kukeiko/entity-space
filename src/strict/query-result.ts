import { Query } from "./query";

export interface QueryResult<Q extends Query = Query> {
    /**
     * The query that represents the data. This query can include identities not found in payload.
     * This just means that entities with those identities don't exist.
     *
     * Example: loaded = [id in (1,2)] but payload only contains entity with id #1
     */
    loaded: Q;

    /**
     * An array of entities loaded.
     */
    payload: Query.Payload<Q>;
}

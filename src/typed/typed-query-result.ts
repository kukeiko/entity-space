import { QueryResult } from "../query";
import { TypedQuery } from "./typed-query";

export interface TypedQueryResult<Q extends TypedQuery> extends QueryResult {
    loaded: Q;

    /**
     * An array of entities loaded.
     */
    payload: TypedQuery.Payload<Q>;
}

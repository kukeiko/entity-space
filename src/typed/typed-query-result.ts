import { QueryResult } from "../query";
import { TypedQuery } from "./typed-query";
import { TypedInstance } from "./typed-instance";

export interface TypedQueryResult<T> extends QueryResult {
    loaded: TypedQuery<T>;
    payload: TypedInstance<T>[];
}

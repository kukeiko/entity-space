import { Class } from "../utils";
import { QueryResult } from "../query";
import { TypedQueryResult } from "./typed-query-result";
import { isTypedQuery } from "./is-typed-query";

export function isTypedQueryResult<T>(result: any, model: Class<T>[]): result is TypedQueryResult<T> {
    return isTypedQuery((result as QueryResult).loaded, model);
}

import { Class } from "../utils";
import { QueryResult } from "../query";
import { TypedQuery } from "./typed-query";
import { TypedQueryResult } from "./typed-query-result";

export function isTypedQueryResult<T extends TypedQuery>(result: any, type: Class<T>): result is TypedQueryResult<T> {
    return (result as QueryResult).loaded instanceof type;
}

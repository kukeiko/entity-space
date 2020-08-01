import { Class } from "../utils";
import { TypedQuery } from "./typed-query";
import { TypedHydratableQueryResult } from "./typed-hydratable-query-result";
import { isTypedQueryResult } from "./is-typed-query-result";

export function isTypedHydratableQueryResult<T extends TypedQuery>(result: any, type: Class<T>): result is TypedHydratableQueryResult<T> {
    return isTypedQueryResult(result, type);
}

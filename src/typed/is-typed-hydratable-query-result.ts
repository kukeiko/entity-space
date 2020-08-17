import { Class } from "../utils";
import { TypedHydratableQueryResult } from "./typed-hydratable-query-result";
import { isTypedQueryResult } from "./is-typed-query-result";

export function isTypedHydratableQueryResult<T>(result: any, model: Class<T>[]): result is TypedHydratableQueryResult<T> {
    return isTypedQueryResult(result, model);
}

import { Class } from "../utils";
import { TypedQuery } from "./typed-query";
import { TypedHydratableQueryResult } from "./typed-hydratable-query-result";
import { HydratableQueryResult } from "../query";

export function isTypedHydratableQueryResult<T extends TypedQuery>(result: any, type: Class<T>): result is TypedHydratableQueryResult<T> {
    return (result as HydratableQueryResult).loaded instanceof type;
}

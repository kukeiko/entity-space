import { HydratableQueryResult } from "../query";
import { TypedQuery } from "./typed-query";
import { TypedSelection } from "./typed-selection";
import { TypedQueryResult } from "./typed-query-result";
import { TypedInstance } from "./typed-instance";

export interface TypedHydratableQueryResult<T> extends TypedQueryResult<T>, HydratableQueryResult {
    selection: TypedSelection<T>;
    loaded: TypedQuery<T>;
    payload: TypedInstance<T>[];
}

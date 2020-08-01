import { HydratableQueryResult } from "../query";
import { TypedQuery } from "./typed-query";
import { TypedSelection } from "./typed-selection";
import { TypedQueryResult } from "./typed-query-result";

export interface TypedHydratableQueryResult<Q extends TypedQuery> extends TypedQueryResult<Q>, HydratableQueryResult {
    selection: TypedSelection<TypedQuery.Model<Q>>;
    loaded: Q;
    payload: TypedQuery.Payload<Q>;
}

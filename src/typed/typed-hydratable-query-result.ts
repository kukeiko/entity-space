import { HydratableQueryResult } from "../query";
import { TypedQuery } from "./typed-query";
import { TypedSelection } from "./typed-selection";

export interface TypedHydratableQueryResult<Q extends TypedQuery> extends HydratableQueryResult {
    selection: TypedSelection<TypedQuery.Model<Q>>;
    loaded: Q;
    payload: TypedQuery.Payload<Q>;
}

import { Selection } from "../selection";
import { Query } from "./query";
import { QueryResult } from "./query-result";

export interface HydratableQueryResult<T> extends QueryResult<Query<T>> {
    selection: Selection<T>;
}

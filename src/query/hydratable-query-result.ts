import { Query } from "./query";
import { QueryResult } from "./query-result";
// import { Class, getInstanceClass } from "../utils";

export interface HydratableQueryResult<T> extends QueryResult<Query<T>> {
    selection: Query.Selection<T>;
}

// export module HydratableQueryResult {
//     export function is<Q extends Query = Query>(result: any, type: Class<Q>): result is HydratableQueryResult<Q> {
//         return getInstanceClass((result as HydratableQueryResult<any>).loaded) === type;
//     }
// }

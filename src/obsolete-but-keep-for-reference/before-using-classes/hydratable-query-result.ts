import { Query } from "./query";
import { Selection } from "../selection";
import { QueryResult } from "./query-result";

export interface HydratableQueryResult<Q extends Query = Query> extends QueryResult<Q> {
    selected: Selection<Query.ModelObjectInstance<Q>>;
}

export module HydratableQueryResult {
    export function is<Q extends Query = Query>(result: any, model?: Q["model"], scope?: Q["scope"]): result is HydratableQueryResult<Q> {
        // [todo] implement
        return {} as any;
    }
}

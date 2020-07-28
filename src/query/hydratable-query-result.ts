import { Selection } from "../selection";
import { QueryResult } from "./query-result";

export interface HydratableQueryResult extends QueryResult {
    selection: Selection;
}

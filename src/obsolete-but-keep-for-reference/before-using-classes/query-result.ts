import { Query } from "./query";

export interface QueryResult<Q extends Query = Query> {
    // the query that represents the data
    // [todo] i don't want this to be voidable. i made it voidable to be able to represent a packet that tried to load by id but no results were found
    loaded: Q;
    // the loaded data
    payload: Query.Payload<Q>;
}

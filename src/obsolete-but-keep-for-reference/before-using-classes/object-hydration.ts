import { Query } from "./query";

// [todo] make sure we can also have "endless" hydrations, i.e. server continues pushing updated hydration data to the client
export interface ObjectHydration<Q extends Query = Query> {
    load: Q;
    assign(items: any[], payload: any[]): void;
}

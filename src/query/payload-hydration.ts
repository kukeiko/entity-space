import { Query } from "./query";

// [todo] make sure we can also have "endless" hydrations, i.e. server continues pushing updated hydration data to the client
export interface PayloadHydration<T, U extends Query = Query> {
    load: U;
    assign(items: T[], payload: Query.Payload<U>): void;
}

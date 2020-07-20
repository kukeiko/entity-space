import { Query } from "./query";

export interface PayloadHydration<T, U extends Query = Query> {
    load: U;
    assign(items: T[], payload: Query.Payload<U>): void;
}

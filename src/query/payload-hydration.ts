import { Instance } from "../instance";
import { Query } from "./query";

export interface PayloadHydration<T, U extends Query = Query> {
    load: U;
    assign(items: Instance<T>[], payload: Query.Payload<U>): void;
}
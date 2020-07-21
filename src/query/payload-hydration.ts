import { Query } from "./query";
import { Instance } from "../advanced/instance";

export interface PayloadHydration<T, U extends Query = Query> {
    load: U;
    assign(items: Instance<T>[], payload: Query.Payload<U>): void;
}

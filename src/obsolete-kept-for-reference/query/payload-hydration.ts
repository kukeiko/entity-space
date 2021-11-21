import { Query } from "./query";
import { Instance } from "./instance";

export interface PayloadHydration {
    load: Query;
    assign(items: Instance[], payload: Instance[]): void;
}

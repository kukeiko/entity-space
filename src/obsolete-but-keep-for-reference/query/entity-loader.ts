import { Observable } from "rxjs";
import { Query } from "./query";
import { QueriedEntitySet } from "./queried-entity-set";
import { Workspace } from "../workspace";

export interface EntityLoader<T = any> {
    load$(query: Query<T>, workspace: Workspace): Observable<QueriedEntitySet<T>>;
}

import { Query } from "../query/query";
import { EntitySet } from "./data-structures";

export interface IEntitySource {
    query(query: Query): Promise<false | EntitySet[]>;
}

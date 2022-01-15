import { Query } from "../query/query";
import { Entity } from "./entity";

export interface IEntitySource {
    query(query: Query): Promise<Entity[]>;
}

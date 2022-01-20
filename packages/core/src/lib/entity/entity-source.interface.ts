import { Query } from "../query/query";
import { QueriedEntities } from "./queried-entities";

export interface IEntitySource {
    query(query: Query): Promise<QueriedEntities>;
}

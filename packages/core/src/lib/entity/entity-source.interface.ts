import { Query } from "../query/query";
import { QueriedEntities } from "./data-structures/queried-entities";

export interface IEntitySource {
    query(query: Query): Promise<false | QueriedEntities[]>;
}

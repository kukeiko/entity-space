import { IEntityType } from "./metadata";
import { Query } from "./query";

export interface IQueryExecuter<T> {
    entityType?: IEntityType<T>;
    loadAll?: (q: Query.All<T>) => Promise<T[]>;
    loadOne?: (q: Query.ByKey<T>) => Promise<T>;
    loadMany?: (q: Query.ByKeys<T>) => Promise<T[]>;
    loadByIndex?: (q: Query.ByIndex<T>) => Promise<T[]>;
    loadByIndexes?: (q: Query.ByIndexes<T>) => Promise<T[]>;
}
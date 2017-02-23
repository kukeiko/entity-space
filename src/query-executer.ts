import { Query } from "./elements";

export interface IQueryExecuter<T> {
    loadAll?: (q: Query.All<T>) => Promise<T[]>;
    loadOne?: (q: Query.ByKey<T>) => Promise<T>;
    loadMany?: (q: Query.ByKeys<T>) => Promise<T[]>;
    loadByIndexes?: (q: Query.ByIndexes<T>) => Promise<T[]>;
    save?: (entity: T, diff?: Partial<T>) => Promise<T>;
    delete?: (entity: T) => Promise<void>;
}

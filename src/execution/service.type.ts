import { StringIndexable } from "../util";
import { Saveables, Query } from "../elements";
import { IEntity, AnyEntityType } from "../metadata";

export interface IService {
    loadAll?: (q: Query.All<any>) => Promise<StringIndexable[]>;
    loadOne?: (q: Query.ByKey<any>) => Promise<StringIndexable>;
    loadMany?: (q: Query.ByKeys<any>) => Promise<StringIndexable[]>;
    loadByIndexes?: (q: Query.ByIndexes<any>) => Promise<StringIndexable[]>;
    save?: (saveables: Saveables) => Promise<Map<AnyEntityType, StringIndexable[]>>;
    delete?: (entities: IEntity[]) => Promise<void>;
}

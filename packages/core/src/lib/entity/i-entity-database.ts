import { IEntitySchema } from "@entity-space/common";
import { Observable } from "rxjs";
import { Query } from "../query/query";
import { EntitySet } from "./data-structures/entity-set";
import { Entity } from "./entity";

export interface IEntityDatabase {
    query(query: Query): Promise<EntitySet>;
    upsert(entities: EntitySet): Promise<void>;
    queryCacheChanged$(): Observable<Query[]>;
    getCachedQueries(schema: IEntitySchema): Query[];
    // [todo] try to get rid of this - had to introduce when switching "InMemoryEntityDatabase"
    // w/ "IEntityDatabase" in EntitySourceGateway
    querySync<T extends Entity = Entity>(query: Query): EntitySet<T>;
}

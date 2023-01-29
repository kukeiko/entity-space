import { Observable } from "rxjs";
import { Entity } from "../common/entity.type";
import { IEntitySchema } from "../common/schema/schema.interface";
import { EntityQuery } from "../query/entity-query";
import { EntitySet } from "./data-structures/entity-set";

export interface IEntityDatabase {
    query(query: EntityQuery): Promise<EntitySet>;
    upsert(entities: EntitySet): Promise<void>;
    queryCacheChanged$(): Observable<EntityQuery[]>;
    getCachedQueries(schema: IEntitySchema): EntityQuery[];
    // [todo] try to get rid of this - had to introduce when switching "InMemoryEntityDatabase"
    // w/ "IEntityDatabase" in EntitySourceGateway
    querySync<T extends Entity = Entity>(query: EntityQuery): EntitySet<T>;
}

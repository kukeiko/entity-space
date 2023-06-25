import { Observable } from "rxjs";
import { Entity } from "../common/entity.type";
import { IEntitySchema } from "../schema/schema.interface";
import { IEntityQuery } from "../query/entity-query.interface";
import { EntitySet } from "./data-structures/entity-set";

export interface IEntityDatabase {
    query(query: IEntityQuery): Promise<EntitySet>;
    upsert(entities: EntitySet): Promise<void>;
    getQueryCache$(): Observable<IEntityQuery[]>;
    getCachedQueries(schema: IEntitySchema): IEntityQuery[];
    // [todo] try to get rid of this - had to introduce when switching "InMemoryEntityDatabase"
    // w/ "IEntityDatabase" in EntitySourceGateway
    querySync<T extends Entity = Entity>(query: IEntityQuery): EntitySet<T>;
}

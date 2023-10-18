import { Observable } from "rxjs";
import { Entity } from "../common/entity.type";
import { IEntityQuery } from "../query/entity-query.interface";
import { IEntitySchema } from "../schema/schema.interface";
import { EntitySet } from "../entity/entity-set";

export interface IEntityDatabase {
    query$(query: IEntityQuery): Observable<EntitySet>;
    query(query: IEntityQuery): Promise<EntitySet>;
    upsert$<T extends Entity = Entity>(entities: EntitySet<T>): Observable<void>;
    upsert(entities: EntitySet): Promise<void>;
    getQueryCache$(): Observable<IEntityQuery[]>;
    /**
     * @deprecated want to remove sync calls
     * @param schema
     */
    getCachedQueries(schema: IEntitySchema): IEntityQuery[];
    getCachedQueries$(): Observable<IEntityQuery[]>;
    // getCachedQueries$
    // [todo] try to get rid of this - had to introduce when switching "InMemoryEntityDatabase"
    // w/ "IEntityDatabase" in EntitySourceGateway
    querySync<T extends Entity = Entity>(query: IEntityQuery): EntitySet<T>;
}

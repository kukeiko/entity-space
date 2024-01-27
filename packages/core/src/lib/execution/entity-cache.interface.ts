import { Entity } from "../common/entity.type";
import { EntitySet } from "../entity/entity-set";
import { IEntityQuery } from "../query/entity-query.interface";
import { IEntitySchema } from "../schema/schema.interface";

export interface IEntityCache {
    query<T extends Entity = Entity>(query: IEntityQuery): EntitySet<T>;
    upsert(entitySet: EntitySet<Entity>): void;
    subtractQuery(query: IEntityQuery): IEntityQuery[] | false;
    subtractQueries(queries: IEntityQuery[]): IEntityQuery[] | false;
    clearByQuery(query: IEntityQuery): void;
    clear(): void;
    clearBySchema(schema: IEntitySchema): void;
}

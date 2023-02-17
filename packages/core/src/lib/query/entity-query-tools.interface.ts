import { Entity } from "../common/entity.type";
import { UnpackedEntitySelection } from "../common/unpacked-entity-selection.type";
import { ICriterion } from "../criteria/vnext/criterion.interface";
import { EntitySchemaCatalog } from "../schema/entity-schema-catalog";
import { IEntitySchema } from "../schema/schema.interface";
import { IEntityQuery } from "./entity-query.interface";
import { EntitySelection } from "./entity-selection";
import { QueryPaging } from "./query-paging";

export interface EntityQueryCreate {
    entitySchema: IEntitySchema;
    criteria?: ICriterion;
    options?: ICriterion;
    selection?: EntitySelection | UnpackedEntitySelection;
    paging?: QueryPaging;
}

export interface IEntityQueryTools {
    createQuery(args: EntityQueryCreate): IEntityQuery;
    createIdQueryFromEntities(schema: IEntitySchema, entities: Entity[]): IEntityQuery;
    createQueriesFromEntities(schema: IEntitySchema, entities: Entity[]): IEntityQuery[];
    mergeQueries(...queries: IEntityQuery[]): IEntityQuery[];
    mergeQuery(a: IEntityQuery, b: IEntityQuery): false | IEntityQuery;
    subtractQuery(factory: IEntityQueryTools, a: IEntityQuery, b: IEntityQuery): IEntityQuery[] | false;
    subtractQueries(queriesA: IEntityQuery[], queriesB: IEntityQuery[]): IEntityQuery[] | false;
    parseQuery(input: string, schemas: EntitySchemaCatalog): IEntityQuery;
}

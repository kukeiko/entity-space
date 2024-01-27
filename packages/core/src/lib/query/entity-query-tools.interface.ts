import { Entity } from "../common/entity.type";
import { UnpackedEntitySelection } from "../common/unpacked-entity-selection.type";
import { ICriterion } from "../criteria/criterion.interface";
import { EntitySchemaCatalog } from "../schema/entity-schema-catalog";
import { IEntitySchema } from "../schema/schema.interface";
import { IEntityQuery } from "./entity-query.interface";
import { EntitySelection } from "./entity-selection";
import { QueryPaging } from "./query-paging";

export interface EntityQueryCreate {
    entitySchema: IEntitySchema;
    criteria?: ICriterion;
    selection?: EntitySelection | UnpackedEntitySelection;
    paging?: QueryPaging;
    parameters?: Entity;
}

export interface IEntityQueryTools {
    toDestructurable(): IEntityQueryTools;
    createQuery(args: EntityQueryCreate): IEntityQuery;
    createIdQueryFromEntities(schema: IEntitySchema, entities: Entity[]): IEntityQuery;
    createQueriesFromEntities(schema: IEntitySchema, entities: Entity[]): IEntityQuery[];
    mergeQueries(...queries: IEntityQuery[]): IEntityQuery[];
    mergeQuery(a: IEntityQuery, b: IEntityQuery): false | IEntityQuery;
    subtractQuery(factory: IEntityQueryTools, a: IEntityQuery, b: IEntityQuery): IEntityQuery[] | false;
    subtractQueries(what: IEntityQuery[], by: IEntityQuery[]): IEntityQuery[] | false;
    parseQuery(input: string, schemas: EntitySchemaCatalog): IEntityQuery;
}

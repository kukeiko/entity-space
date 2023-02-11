import { UnpackedEntitySelection } from "../common/unpacked-entity-selection.type";
import { ICriterion } from "../criteria/vnext/criterion.interface";
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

export interface IEntityQueryFactory {
    createQuery(args: EntityQueryCreate): IEntityQuery;
}

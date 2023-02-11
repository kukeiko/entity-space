import { UnpackedEntitySelection } from "../common/unpacked-entity-selection.type";
import { ICriterion } from "../criteria/vnext/criterion.interface";
import { IEntitySchema } from "../schema/schema.interface";
import { EntitySelection } from "./entity-selection";
import { QueryPaging } from "./query-paging";

export interface IEntityQuery {
    getCriteria(): ICriterion;
    getSelection(): EntitySelection;
    getOptions(): ICriterion;
    getPaging(): QueryPaging | undefined;
    getEntitySchema(): IEntitySchema;
    intersect(other: IEntityQuery): false | IEntityQuery;
    intersectCriteriaOmitSelection(other: IEntityQuery): false | IEntityQuery;
    withSelection(selection: EntitySelection | UnpackedEntitySelection): IEntityQuery;
    withCriteria(criteria: ICriterion): IEntityQuery;
}

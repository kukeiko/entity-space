import { Entity } from "../common/entity.type";
import { UnpackedEntitySelection } from "../common/unpacked-entity-selection.type";
import { ICriterion } from "../criteria/criterion.interface";
import { IEntitySchema } from "../schema/schema.interface";
import { EntitySelection } from "./entity-selection";
import { QueryPaging } from "./query-paging";

export interface IEntityQuery {
    getCriteria(): ICriterion;
    getSelection(): EntitySelection;
    getOptions(): ICriterion;
    getPaging(): QueryPaging | undefined;
    getParameters(): Entity | undefined;
    getEntitySchema(): IEntitySchema;
    intersect(other: IEntityQuery): false | IEntityQuery;
    intersectCriteriaOmitSelection(other: IEntityQuery): false | IEntityQuery;
    withSelection(selection: EntitySelection | UnpackedEntitySelection): IEntityQuery;
    withCriteria(criteria: ICriterion): IEntityQuery;
    toString(): string;
}

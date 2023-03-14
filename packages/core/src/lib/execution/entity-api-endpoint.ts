import { Observable } from "rxjs";
import { Entity } from "../common/entity.type";
import { UnpackedEntitySelection } from "../common/unpacked-entity-selection.type";
import { ICriterionShape } from "../criteria/criterion-shape.interface";
import { ICriterion } from "../criteria/criterion.interface";
import { WhereEntityShape } from "../criteria/where-entity/where-entity-shape.types";
import { EntitySet } from "../entity/data-structures/entity-set";
import { IEntityQuery } from "../query/entity-query.interface";
import { EntitySelection } from "../query/entity-selection";
import { QueryPaging } from "../query/query-paging";
import { IEntitySchema } from "../schema/schema.interface";

export type EntityApiEndpointData<T extends Entity = Entity> = T | T[] | EntitySet<T>;

export type EntityApiEndpointInvoke<T extends Entity = Entity, C = {}> = (query: {
    query: IEntityQuery;
    selection: UnpackedEntitySelection<T>;
    paging?: QueryPaging;
    criteria: C;
}) => Observable<EntityApiEndpointData<T>> | Promise<EntityApiEndpointData<T>> | EntityApiEndpointData<T>;

export class EntityApiEndpoint {
    constructor({
        acceptCriterion,
        criterionShape,
        invoke,
        whereEntityShape,
        schema,
        selection,
    }: {
        acceptCriterion?: (criterion: ICriterion) => boolean;
        criterionShape: ICriterionShape;
        invoke: EntityApiEndpointInvoke;
        whereEntityShape?: WhereEntityShape;
        schema: IEntitySchema;
        selection: EntitySelection;
    }) {
        this.acceptCriterionFn = acceptCriterion ?? (() => true);
        this.criterionTemplate = criterionShape;
        this.invoke = invoke;
        this.whereEntityShape = whereEntityShape;
        this.schema = schema;
        this.selection = selection;
    }

    private readonly schema: IEntitySchema;
    private readonly whereEntityShape?: WhereEntityShape;
    private readonly optionsTemplate?: ICriterionShape;
    private readonly criterionTemplate: ICriterionShape;
    private readonly selection: EntitySelection;
    private readonly invoke: EntityApiEndpointInvoke;
    private readonly acceptCriterionFn: (criterion: ICriterion) => boolean;

    getSchema(): IEntitySchema {
        return this.schema;
    }

    getWhereEntityShape(): WhereEntityShape | undefined {
        return this.whereEntityShape;
    }

    getCriterionTemplate(): ICriterionShape {
        return this.criterionTemplate;
    }

    getOptionsTemplate(): ICriterionShape | undefined {
        return this.optionsTemplate;
    }

    getSelection(): EntitySelection {
        return this.selection;
    }

    getInvoke(): EntityApiEndpointInvoke {
        return this.invoke;
    }

    acceptCriterion(criterion: ICriterion): boolean {
        return this.acceptCriterionFn(criterion);
    }
}

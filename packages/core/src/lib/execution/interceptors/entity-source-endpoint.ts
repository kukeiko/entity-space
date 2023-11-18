import { Observable } from "rxjs";
import { Entity } from "../../common/entity.type";
import { UnpackedEntitySelection } from "../../common/unpacked-entity-selection.type";
import { ICriterionShape } from "../../criteria/criterion-shape.interface";
import { ICriterion } from "../../criteria/criterion.interface";
import { WhereEntityShape } from "../../criteria/where-entity/where-entity-shape.types";
import { EntitySet } from "../../entity/entity-set";
import { EntityQueryParametersShape, EntityQueryShape } from "../../query/entity-query-shape";
import { IEntityQuery } from "../../query/entity-query.interface";
import { EntitySelection } from "../../query/entity-selection";
import { QueryPaging } from "../../query/query-paging";
import { IEntitySchema } from "../../schema/schema.interface";

export type EntitySourceEndpointData<T extends Entity = Entity> = T | T[] | EntitySet<T>;

export type EntitySourceEndpointInvoke<
    T extends Entity = Entity,
    C = {},
    P extends Entity | undefined = Entity | undefined
> = (query: {
    query: IEntityQuery;
    selection: UnpackedEntitySelection<T>;
    paging?: QueryPaging;
    parameters: P;
    criteria: C;
}) => Observable<EntitySourceEndpointData<T>> | Promise<EntitySourceEndpointData<T>> | EntitySourceEndpointData<T>;

export class EntitySourceEndpoint {
    constructor({
        acceptCriterion,
        criterionShape,
        invoke,
        whereEntityShape,
        schema,
        parametersShape,
        selection,
    }: {
        acceptCriterion?: (criterion: ICriterion) => boolean;
        criterionShape: ICriterionShape;
        invoke: EntitySourceEndpointInvoke;
        whereEntityShape?: WhereEntityShape;
        schema: IEntitySchema;
        parametersShape?: EntityQueryParametersShape;
        selection: EntitySelection;
    }) {
        this.acceptCriterionFn = acceptCriterion ?? (() => true);
        this.criterionShape = criterionShape;
        this.invoke = invoke;
        this.whereEntityShape = whereEntityShape;
        this.schema = schema;
        this.parametersShape = parametersShape;
        this.selection = selection;
        this.queryShape = new EntityQueryShape({
            schema: this.schema,
            criterion: this.criterionShape,
            selection: this.selection,
            parameters: this.parametersShape,
        });
    }

    private readonly schema: IEntitySchema;
    private readonly parametersShape?: EntityQueryParametersShape;
    private readonly whereEntityShape?: WhereEntityShape;
    private readonly criterionShape: ICriterionShape;
    private readonly selection: EntitySelection;
    private readonly queryShape: EntityQueryShape;
    private readonly invoke: EntitySourceEndpointInvoke;
    private readonly acceptCriterionFn: (criterion: ICriterion) => boolean;

    getSchema(): IEntitySchema {
        return this.schema;
    }

    getQueryShape(): EntityQueryShape {
        return this.queryShape;
    }

    getParametersShape(): EntityQueryParametersShape | undefined {
        return this.parametersShape;
    }

    getWhereEntityShape(): WhereEntityShape | undefined {
        return this.whereEntityShape;
    }

    getCriterionShape(): ICriterionShape {
        return this.criterionShape;
    }

    getSelection(): EntitySelection {
        return this.selection;
    }

    getInvoke(): EntitySourceEndpointInvoke {
        return this.invoke;
    }

    acceptCriterion(criterion: ICriterion): boolean {
        return this.acceptCriterionFn(criterion);
    }
}

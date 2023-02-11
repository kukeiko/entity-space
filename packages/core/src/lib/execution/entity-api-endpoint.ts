import { Observable } from "rxjs";
import { Entity } from "../common/entity.type";
import { UnpackedEntitySelection } from "../common/unpacked-entity-selection.type";
import { ICriterionShape } from "../criteria/vnext/criterion-shape.interface";
import { ICriterion } from "../criteria/vnext/criterion.interface";
import { EntitySet } from "../entity/data-structures/entity-set";
import { EntitySelection } from "../query/entity-selection";
import { QueryPaging } from "../query/query-paging";
import { IEntitySchema } from "../schema/schema.interface";

export type EntityApiEndpointData<T extends Entity = Entity> = T | T[] | EntitySet<T>;

export type EntityApiEndpointInvoke<T extends Entity = Entity, C = ICriterionShape, O = ICriterionShape> = (query: {
    // [todo] fix
    criterion: any; //InstancedCriterionShape<C>;
    // [todo] fix
    options: any; //InstancedCriterionShape<O>;
    selection: UnpackedEntitySelection<T>;
    paging?: QueryPaging;
}) => Observable<EntityApiEndpointData<T>> | Promise<EntityApiEndpointData<T>> | EntityApiEndpointData<T>;

export class EntityApiEndpoint {
    constructor({
        schema,
        optionsTemplate,
        criterionTemplate,
        selection,
        invoke,
        acceptCriterion,
        sortableFields,
        pagingRequired,
        pagingSupported,
    }: {
        schema: IEntitySchema;
        optionsTemplate?: ICriterionShape;
        criterionTemplate: ICriterionShape;
        selection: EntitySelection;
        invoke: EntityApiEndpointInvoke;
        acceptCriterion?: (criterion: ICriterion) => boolean;
        sortableFields?: string[];
        pagingRequired?: boolean;
        pagingSupported?: boolean;
    }) {
        this.schema = schema;
        this.criterionTemplate = criterionTemplate;
        this.optionsTemplate = optionsTemplate;
        this.selection = selection;
        this.invoke = invoke;
        this.acceptCriterionFn = acceptCriterion ?? (() => true);
        this.sortableFields = sortableFields ?? [];
        this.pagingRequired = pagingRequired ?? false;
        this.pagingSupported = pagingSupported ?? false;
    }

    private readonly schema: IEntitySchema;
    private readonly optionsTemplate?: ICriterionShape;
    private readonly criterionTemplate: ICriterionShape;
    private readonly selection: EntitySelection;
    private readonly invoke: EntityApiEndpointInvoke;
    private readonly acceptCriterionFn: (criterion: ICriterion) => boolean;
    private readonly pagingRequired: boolean;
    private readonly pagingSupported: boolean;
    private readonly sortableFields: string[];

    getSchema(): IEntitySchema {
        return this.schema;
    }

    getCriterionTemplate(): ICriterionShape {
        return this.criterionTemplate;
    }

    getOptionsTemplate(): ICriterionShape|undefined {
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

    getSortableFields(): string[] {
        return this.sortableFields;
    }

    requiresPaging(): boolean {
        return this.pagingRequired;
    }

    supportsPaging(): boolean {
        return this.pagingSupported;
    }
}

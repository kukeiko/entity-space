import { Observable } from "rxjs";
import { Entity } from "../common/entity.type";
import { UnpackedEntitySelection } from "../common/unpacked-entity-selection.type";
import { ICriterionShape } from "../criteria/vnext/criterion-shape.interface";
import { ICriterion } from "../criteria/vnext/criterion.interface";
import { WhereEntityShape } from "../criteria/vnext/where-entity/where-entity-shape.types";
import { EntitySet } from "../entity/data-structures/entity-set";
import { EntitySelection } from "../query/entity-selection";
import { QueryPaging } from "../query/query-paging";
import { IEntitySchema } from "../schema/schema.interface";

export type EntityApiEndpointData<T extends Entity = Entity> = T | T[] | EntitySet<T>;

export type EntityApiEndpointInvoke<
    T extends Entity = Entity,
    C = ICriterionShape,
    O = ICriterionShape,
    SI = {}
> = (query: {
    // [todo] fix
    criterion: any; //InstancedCriterionShape<C>;
    // [todo] fix
    options: any; //InstancedCriterionShape<O>;
    selection: UnpackedEntitySelection<T>;
    paging?: QueryPaging;
    criterion_v2: SI;
}) => Observable<EntityApiEndpointData<T>> | Promise<EntityApiEndpointData<T>> | EntityApiEndpointData<T>;

export class EntityApiEndpoint {
    constructor({
        acceptCriterion,
        criterionTemplate,
        invoke,
        optionsTemplate,
        pagingRequired,
        pagingSupported,
        publicCriterionShape,
        schema,
        selection,
        sortableFields,
    }: {
        acceptCriterion?: (criterion: ICriterion) => boolean;
        criterionTemplate: ICriterionShape;
        invoke: EntityApiEndpointInvoke;
        optionsTemplate?: ICriterionShape;
        pagingRequired?: boolean;
        pagingSupported?: boolean;
        publicCriterionShape?: WhereEntityShape;
        schema: IEntitySchema;
        selection: EntitySelection;
        sortableFields?: string[];
    }) {
        this.acceptCriterionFn = acceptCriterion ?? (() => true);
        this.criterionTemplate = criterionTemplate;
        this.invoke = invoke;
        this.optionsTemplate = optionsTemplate;
        this.pagingRequired = pagingRequired ?? false;
        this.pagingSupported = pagingSupported ?? false;
        this.publicCriterionShape = publicCriterionShape;
        this.schema = schema;
        this.selection = selection;
        this.sortableFields = sortableFields ?? [];
    }

    private readonly schema: IEntitySchema;
    private readonly publicCriterionShape?: WhereEntityShape;
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

    getPublicCriterionShape(): WhereEntityShape | undefined {
        return this.publicCriterionShape;
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

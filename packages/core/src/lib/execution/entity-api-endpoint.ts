import { Entity, EntitySelectionValue, IEntitySchema } from "@entity-space/common";
import { Criterion, ICriterionTemplate, InstancedCriterionTemplate } from "@entity-space/criteria";
import { Observable } from "rxjs";
import { EntitySet } from "../entity/data-structures/entity-set";
import { EntitySelection } from "../query/entity-selection";
import { QueryPaging } from "../query/query-paging";

export type EntityApiEndpointData<T extends Entity = Entity> = T | T[] | EntitySet<T>;

export type EntityApiEndpointInvoke<
    T extends Entity = Entity,
    C = ICriterionTemplate,
    O = ICriterionTemplate
> = (query: {
    criterion: InstancedCriterionTemplate<C>;
    options: InstancedCriterionTemplate<O>;
    // expansion: UnfoldedExpansion<T>;
    selection: EntitySelectionValue<T>; // [todo] want to use unfolded instead
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
        optionsTemplate: ICriterionTemplate;
        criterionTemplate: ICriterionTemplate;
        selection: EntitySelection;
        invoke: EntityApiEndpointInvoke;
        acceptCriterion?: (criterion: Criterion) => boolean;
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
    private readonly optionsTemplate: ICriterionTemplate;
    private readonly criterionTemplate: ICriterionTemplate;
    private readonly selection: EntitySelection;
    private readonly invoke: EntityApiEndpointInvoke;
    private readonly acceptCriterionFn: (criterion: Criterion) => boolean;
    private readonly pagingRequired: boolean;
    private readonly pagingSupported: boolean;
    private readonly sortableFields: string[];

    getSchema(): IEntitySchema {
        return this.schema;
    }

    getCriterionTemplate(): ICriterionTemplate {
        return this.criterionTemplate;
    }

    getOptionsTemplate(): ICriterionTemplate {
        return this.optionsTemplate;
    }

    getSelection(): EntitySelection {
        return this.selection;
    }

    getInvoke(): EntityApiEndpointInvoke {
        return this.invoke;
    }

    acceptCriterion(criterion: Criterion): boolean {
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

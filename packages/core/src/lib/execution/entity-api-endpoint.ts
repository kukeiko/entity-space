import { Entity, ExpansionValue, IEntitySchema } from "@entity-space/common";
import { Criterion, ICriterionTemplate, InstancedCriterionTemplate } from "@entity-space/criteria";
import { Observable } from "rxjs";
import { EntitySet } from "../entity/data-structures/entity-set";
import { Expansion } from "../expansion/expansion";

export type EntityApiEndpointData<T = Entity> = T | T[] | EntitySet<T>;

export type EntityApiEndpointInvoke<T = Entity, C = ICriterionTemplate> = (query: {
    criterion: InstancedCriterionTemplate<C>;
    // expansion: UnfoldedExpansion<T>;
    expansion: ExpansionValue<T>; // [todo] want to use unfolded instead
}) => Observable<EntityApiEndpointData<T>> | Promise<EntityApiEndpointData<T>> | EntityApiEndpointData<T>;

export class EntityApiEndpoint {
    constructor({
        schema,
        template,
        expansion,
        invoke,
        acceptCriterion,
    }: {
        schema: IEntitySchema;
        template: ICriterionTemplate;
        expansion: Expansion;
        invoke: EntityApiEndpointInvoke;
        acceptCriterion?: (criterion: Criterion) => boolean;
    }) {
        this.schema = schema;
        this.template = template;
        this.expansion = expansion;
        this.invoke = invoke;
        this.acceptCriterionFn = acceptCriterion ?? (() => true);
    }

    private readonly schema: IEntitySchema;
    private readonly template: ICriterionTemplate;
    private readonly expansion: Expansion;
    private readonly invoke: EntityApiEndpointInvoke;
    private readonly acceptCriterionFn: (criterion: Criterion) => boolean;

    getSchema(): IEntitySchema {
        return this.schema;
    }

    getTemplate(): ICriterionTemplate {
        return this.template;
    }

    getExpansion(): Expansion {
        return this.expansion;
    }

    getInvoke(): EntityApiEndpointInvoke {
        return this.invoke;
    }

    acceptCriterion(criterion: Criterion): boolean {
        return this.acceptCriterionFn(criterion);
    }
}

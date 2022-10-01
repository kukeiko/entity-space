import { ExpansionValue } from "@entity-space/common";
import { Criterion, ICriterionTemplate, InstancedCriterionTemplate } from "@entity-space/criteria";
import { Observable } from "rxjs";
import { Entity, EntitySet } from "../../entity";
import { Expansion } from "../../expansion";
import { IEntitySchema } from "../../schema";

type Data<T> = T | T[] | EntitySet<T>;

export type EntityControllerEndpointInvoke<T = Entity, C = ICriterionTemplate> = (query: {
    criterion: InstancedCriterionTemplate<C>;
    // expansion: UnfoldedExpansion<T>;
    expansion: ExpansionValue<T>; // [todo] want to use unfolded instead
}) => Observable<Data<T>> | Promise<Data<T>> | Data<T>;

export class EntityControllerEndpoint {
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
        invoke: EntityControllerEndpointInvoke;
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
    private readonly invoke: EntityControllerEndpointInvoke;
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

    getInvoke(): EntityControllerEndpointInvoke {
        return this.invoke;
    }

    acceptCriterion(criterion: Criterion): boolean {
        return this.acceptCriterionFn(criterion);
    }
}

import { ICriterionTemplate, InstancedCriterionTemplate } from "@entity-space/criteria";
import { DeepPartial } from "@entity-space/utils";
import { Observable } from "rxjs";
import { Entity, EntitySet } from "../../entity";
import { Expansion } from "../../expansion/expansion";
import { IEntitySchema } from "../../schema";
import { Query } from "../query";

type Data<T> = T | T[] | EntitySet<T>;

type EntityControllerEndpointInvoke<T, U, V> = (
    query: Query<T, InstancedCriterionTemplate<U>, V extends Expansion<infer E> ? DeepPartial<E> : never>
) => Observable<Data<T>> | Promise<Data<T>> | Data<T>;

export class EntityControllerEndpoint<
    T extends Entity = Entity,
    U extends ICriterionTemplate = ICriterionTemplate,
    V extends Expansion<T> = Expansion<T>
> {
    constructor({
        schema,
        template,
        expansion,
        invoke,
        acceptCriterion,
    }: {
        schema: IEntitySchema<T>;
        template: U;
        expansion: V;
        invoke: EntityControllerEndpointInvoke<T, U, V>;
        acceptCriterion?: (criterion: InstancedCriterionTemplate<U>) => InstancedCriterionTemplate<U> | false;
    }) {
        this.schema = schema;
        this.template = template;
        this.expansion = expansion;
        this.invoke = invoke;
        this.acceptCriterionFn = acceptCriterion;
    }

    private readonly schema: IEntitySchema<T>;
    private readonly template: U;
    private readonly expansion: V;
    private readonly invoke: EntityControllerEndpointInvoke<T, U, V>;
    private readonly acceptCriterionFn?: (
        criterion: InstancedCriterionTemplate<U>
    ) => InstancedCriterionTemplate<U> | false;

    getSchema(): IEntitySchema<T> {
        return this.schema;
    }

    getTemplate(): U {
        return this.template;
    }

    getExpansion(): V {
        return this.expansion;
    }

    getInvoke(): EntityControllerEndpointInvoke<T, U, V> {
        return this.invoke;
    }

    acceptCriterion(criterion: InstancedCriterionTemplate<U>): InstancedCriterionTemplate<U> | false {
        return this.acceptCriterionFn?.(criterion) ?? criterion;
    }
}

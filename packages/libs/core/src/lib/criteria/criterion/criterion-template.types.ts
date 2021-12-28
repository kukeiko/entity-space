import { Class } from "@entity-space/utils";
import { Criterion } from "./criterion";
import { AndCriteria, AndCriteriaTemplate } from "./and";
import { NamedCriteria, NamedCriteriaTemplate } from "./named";
import { OrCriteria, OrCriteriaTemplate } from "./or";

export type NamedCriteriaBagTemplate = { [key: string]: CriterionTemplate[] };
export type InstancedNamedCriteriaBagTemplate<T extends NamedCriteriaBagTemplate> = {
    [K in keyof T]: InstancedCriterionTemplate<T[K][number]>;
};

export type CriterionTemplate = Class<Criterion> | AndCriteriaTemplate | OrCriteriaTemplate | NamedCriteriaTemplate;

export type InstancedCriterionTemplate<T extends CriterionTemplate> = T extends Class<Criterion>
    ? InstanceType<T>
    : T extends NamedCriteriaTemplate<infer U>
    ? NamedCriteria<InstancedNamedCriteriaBagTemplate<U>>
    : T extends OrCriteriaTemplate<infer U>
    ? OrCriteria<InstancedCriterionTemplate<U[number]>>
    : T extends AndCriteriaTemplate<infer U>
    ? AndCriteria<InstancedCriterionTemplate<U[number]>>
    : never;

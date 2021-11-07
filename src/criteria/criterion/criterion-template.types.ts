import { Class } from "../../utils";
import { Criterion } from "./criterion";
import { AndCriteria, AndCriteriaTemplate } from "./and";
import { NamedCriteria, NamedCriteriaTemplate } from "./named";
import { OrCriteria, OrCriteriaTemplate } from "./or";

export type NamedCriteriaBagTemplate = { [key: string]: CriterionTemplate[] };
export type InstancedNamedCriteriaBagTemplate<T extends NamedCriteriaBagTemplate> = { [K in keyof T]: InstancedCriterionTemplate<T[K]> };

export type CriterionTemplate = Class<Criterion> | AndCriteriaTemplate | OrCriteriaTemplate | NamedCriteriaTemplate;
// | [typeof AndCriteria, CriterionTemplate[]]
// | [typeof OrCriteria, CriterionTemplate[]]
// | [typeof NamedCriteria, NamedCriteriaBagTemplate];

export type InstancedCriterionTemplate<T extends CriterionTemplate | CriterionTemplate[]> = T extends Class<Criterion>
    ? InstanceType<T>
    : T extends NamedCriteriaTemplate<infer U>
    ? NamedCriteria<InstancedNamedCriteriaBagTemplate<U>>
    : T extends OrCriteriaTemplate<infer U>
    ? OrCriteria<InstancedCriterionTemplate<U>>
    : T extends AndCriteriaTemplate<infer U>
    ? AndCriteria<InstancedCriterionTemplate<U>>
    : T extends CriterionTemplate[]
    ? InstancedCriterionTemplate<T[number]>
    : never;
// : T extends [typeof NamedCriteria, NamedCriteriaBagTemplate]
// ? NamedCriteria<InstancedNamedCriteriaBagTemplate<T[1]>>
// : T extends [typeof OrCriteria, CriterionTemplate[]]
// ? OrCriteria<InstancedCriterionTemplate<T[1]>>
// : T extends [typeof AndCriteria, CriterionTemplate[]]
// ? AndCriteria<InstancedCriterionTemplate<T[1]>>
// : T extends CriterionTemplate[]
// ? InstancedCriterionTemplate<T[number]>
// : never;

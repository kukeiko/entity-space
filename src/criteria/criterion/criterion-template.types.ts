import { Class } from "../../utils";
import { AndCriteria } from "./and-criteria";
import { Criterion } from "./criterion";
import { NamedCriteria } from "./named-criteria";
import { OrCriteria } from "./or-criteria";

export type NamedCriteriaBagTemplate = { [key: string]: CriterionTemplate[] };
export type InstancedNamedCriteriaBagTemplate<T extends NamedCriteriaBagTemplate> = { [K in keyof T]: InstancedCriterionTemplate<T[K]> };

export type CriterionTemplate =
    | Class<Criterion>
    | [typeof AndCriteria, CriterionTemplate[]]
    | [typeof OrCriteria, CriterionTemplate[]]
    | [typeof NamedCriteria, NamedCriteriaBagTemplate];

export type InstancedCriterionTemplate<T extends CriterionTemplate | CriterionTemplate[]> = T extends Class<Criterion>
    ? InstanceType<T>
    : T extends [typeof NamedCriteria, NamedCriteriaBagTemplate]
    ? NamedCriteria<InstancedNamedCriteriaBagTemplate<T[1]>>
    : T extends [typeof OrCriteria, CriterionTemplate[]]
    ? OrCriteria<InstancedCriterionTemplate<T[1]>>
    : T extends [typeof AndCriteria, CriterionTemplate[]]
    ? AndCriteria<InstancedCriterionTemplate<T[1]>>
    : T extends CriterionTemplate[]
    ? InstancedCriterionTemplate<T[number]>
    : never;

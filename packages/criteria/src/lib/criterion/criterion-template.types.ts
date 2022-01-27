import { Class } from "@entity-space/utils";
import { AndCriteria } from "./and/and-criteria";
import { AndCriteriaTemplate } from "./and/and-criteria-template";
import { Criterion } from "./criterion";
import { NamedCriteria } from "./named/named-criteria";
import { NamedCriteriaTemplate } from "./named/named-criteria-template";
import { OrCriteria } from "./or/or-criteria";
import { OrCriteriaTemplate } from "./or/or-criteria-template";
import { InSetCriterion } from "./set/in-set-criterion";
import { InSetCriterionTemplate } from "./set/in-set-criterion-template";
import { IsValueCriterion } from "./value/is-value-criterion";
import { IsValueCriterionTemplate } from "./value/is-value-criterion-template";
import { NotValueCriterion } from "./value/not-value-criterion";
import { NotValueCriterionTemplate } from "./value/not-value-criterion-template";

export type NamedCriteriaBagTemplate = { [key: string]: CriterionTemplate[] };

export type InstancedNamedCriteriaBagTemplate<T extends NamedCriteriaBagTemplate> = {
    [K in keyof T]: InstancedCriterionTemplate<T[K][number]>;
};

export type CriterionTemplate =
    | AndCriteriaTemplate
    | Class<Criterion>
    | InSetCriterionTemplate
    | IsValueCriterionTemplate
    | NamedCriteriaTemplate
    | NotValueCriterionTemplate
    | OrCriteriaTemplate;
// |NotInVa;

export type InstancedCriterionTemplate<T extends CriterionTemplate> = T extends Class<Criterion>
    ? InstanceType<T>
    : T extends NamedCriteriaTemplate<infer U>
    ? NamedCriteria<InstancedNamedCriteriaBagTemplate<U>>
    : T extends OrCriteriaTemplate<infer U>
    ? OrCriteria<InstancedCriterionTemplate<U[number]>>
    : T extends AndCriteriaTemplate<infer U>
    ? AndCriteria<InstancedCriterionTemplate<U[number]>>
    : T extends IsValueCriterionTemplate<infer U>
    ? IsValueCriterion<U>
    : T extends NotValueCriterionTemplate<infer U>
    ? NotValueCriterion<U>
    : T extends InSetCriterionTemplate<infer U>
    ? InSetCriterion<U>
    : never;

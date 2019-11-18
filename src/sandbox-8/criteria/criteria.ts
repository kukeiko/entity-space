import { Criterion } from "./criterion";
import { SetCriterion } from "./set-criterion";
import { PropertyKeys, Property } from "../property";
import { Primitive, Unbox } from "../lang";
import { WithAttribute } from "../attribute";

export interface Criteria {
    [k: string]: Criterion[] | SetCriterion[] | Criteria[];
}

export type CriteriaForType<T> = {
    [K in PropertyKeys<T>]?:
    T[K] extends Property & { value: Primitive; } ? Criterion[]
    : T[K] extends Property & { value: Primitive; } & WithAttribute<"iterable"> ? SetCriterion[]
    : T[K] extends Property ? CriteriaForType<Unbox<T[K]["value"]>>[]
    : never;
};

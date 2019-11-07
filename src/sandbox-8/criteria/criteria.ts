import { Criterion } from "./criterion";
import { SetCriterion } from "./set-criterion";
import { PropertyKeysOf, Property } from "../property";
import { Primitive, Unbox } from "../lang";
import { Flagged } from "../flag";

export interface Criteria {
    [k: string]: Criterion[] | SetCriterion[] | Criteria[];
}

export type CriteriaForType<T> = {
    [K in PropertyKeysOf<T>]?:
    T[K] extends Property & { value: Primitive; } ? Criterion[]
    : T[K] extends Property & { value: Primitive; } & Flagged<"iterable"> ? SetCriterion[]
    : T[K] extends Property ? CriteriaForType<Unbox<T[K]["value"]>>[]
    : never;
};

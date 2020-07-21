import { Primitive, Unbox, MergeUnion } from "./utils";
import { Property, Attribute } from "./property";
import { ValuesCriterion, ValueCriterion } from "./criteria";

type Criterion<T> = {
    // [K in Property.Keys<T, Attribute.IsFilterable>]?: T[K] extends Property & { value: Primitive } & Attribute.IsIterable
    [K in Property.Keys<T>]?: T[K] extends Property & { value: Primitive } & Attribute.IsIterable
        ? ValuesCriterion[]
        : T[K] extends Property & { value: Primitive }
        ? ValueCriterion[]
        : T[K] extends Property
        ? Criterion<MergeUnion<Unbox<Unbox<T[K]["value"]>>>>[]
        : never;
};

export type Criteria<T> = Criterion<MergeUnion<T>>[];

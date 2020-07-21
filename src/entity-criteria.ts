import { Primitive, Unbox, MergeUnion } from "./utils";
import { Property, Attribute } from "./property";
import { ValuesCriterion, ValueCriterion } from "./criteria";

type EntityCriterion<T> = {
    // [K in Property.Keys<T, Attribute.IsFilterable>]?: T[K] extends Property & { value: Primitive } & Attribute.IsIterable
    [K in Property.Keys<T>]?: T[K] extends Property & { value: Primitive } & Attribute.IsIterable
        ? ValuesCriterion[]
        : T[K] extends Property & { value: Primitive }
        ? ValueCriterion[]
        : T[K] extends Property
        ? EntityCriterion<MergeUnion<Unbox<Unbox<T[K]["value"]>>>>[]
        : never;
};

export type EntityCriteria<T> = EntityCriterion<MergeUnion<T>>[];

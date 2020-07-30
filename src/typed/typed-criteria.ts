import { Primitive, Unbox, MergeUnion, Class } from "../utils";
import { Property, Attribute } from "../property";
import { ValuesCriterion, ValueCriterion } from "../criteria";

type Criterion<T> = {
    // [K in Property.Keys<T, Attribute.IsFilterable>]?: T[K] extends Property & { value: Primitive } & Attribute.IsIterable
    [K in Property.Keys<T>]?: T[K] extends Property & { value: Primitive[] } & Attribute.IsIterable
        ? ValuesCriterion[]
        : T[K] extends Property & { value: Primitive[] }
        ? ValueCriterion[]
        : T[K] extends Property & { value: Class[] }
        ? Criterion<MergeUnion<Unbox<Unbox<T[K]["value"]>>>>[]
        : T[K] extends Property
        ? ValueCriterion[]
        : never;
};

/**
 * [todo] file name doesn't reflect name of type - can't fix it yet, as we have a "criteria" folder with the generic criteria stuff
 * current idea is to have the generic criteria stuff as a separate package, so we'd import from "@entity-space/criteria",
 * or even move it to a completely unrelated repository
 */
export type TypedCriteria<T> = Criterion<MergeUnion<T>>[];

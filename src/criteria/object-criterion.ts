import { ValueCriteria } from "./value-criterion";
import { ValuesCriteria } from "./values-criterion";
import { ObjectCriteria } from "./object-criteria";

// [todo] i feel like this should be simplified to ObjectCriterion = ValueCriteria | ValuesCriteria | ObjectCriteria,
// and we have a separated type for when we want it to be fully typed (based on a T)
export type ObjectCriterion<T = any> = {
    [K in keyof T]?: Exclude<T[K], undefined> extends boolean | number | string | null
        ? ValueCriteria
        : Exclude<T[K], undefined> extends (boolean | number | string | null)[]
        ? ValuesCriteria
        : ObjectCriteria<Exclude<T[K], undefined>>;
};

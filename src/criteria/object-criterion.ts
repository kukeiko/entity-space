import { ValueCriteria } from "./value-criterion";
import { ValuesCriteria } from "./values-criterion";
import { ObjectCriteria } from "./object-criteria";

export type ObjectCriterion<T = any> = {
    [K in keyof T]?: Exclude<T[K], undefined> extends boolean | number | string | null
        ? ValueCriteria
        : Exclude<T[K], undefined> extends (boolean | number | string | null)[]
        ? ValuesCriteria
        : ObjectCriteria<Exclude<T[K], undefined>>;
};

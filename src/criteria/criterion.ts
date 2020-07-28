import { ValueCriteria } from "./value-criterion";
import { ValuesCriteria } from "./values-criterion";
import { Criteria } from "./criteria";

export type Criterion<T = any> = {
    [K in keyof T]?: Exclude<T[K], undefined> extends boolean | number | string | null
        ? ValueCriteria
        : Exclude<T[K], undefined> extends (boolean | number | string | null)[]
        ? ValuesCriteria
        : Criteria<Exclude<T[K], undefined>>;
};

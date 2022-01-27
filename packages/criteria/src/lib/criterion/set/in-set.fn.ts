import { Null } from "@entity-space/utils";
import { Criterion } from "../criterion";
import { InSetCriterion } from "./in-set-criterion";

const valueTypeMap = {
    string: String,
    number: Number,
    boolean: Boolean,
    null: Null,
};

// [todo] handle empty values
export function inSet<T>(values: Iterable<T>): Criterion {
    const typeOfs = new Set(Array.from(values).map(value => (value === null ? "null" : typeof value)));
    // [todo] get rid of any
    const valueTypes = Array.from(typeOfs.values()).map(typeOf => (valueTypeMap as any)[typeOf]);

    return new InSetCriterion(valueTypes, values);
}

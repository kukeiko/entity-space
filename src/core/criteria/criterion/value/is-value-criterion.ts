import { getInstanceClass } from "../../../../utils/public";
import { Criterion } from "../criterion";

// [todo] implement invert()
export abstract class IsValueCriterion<T> extends Criterion {
    constructor(value: T) {
        super();
        this.value = value;
    }

    readonly value: T;

    reduce(other: Criterion): boolean | Criterion {
        if (other instanceof getInstanceClass(this)) {
            if (this.value == other.value) {
                return true;
            }
        }

        return false;
    }
}
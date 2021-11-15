import { getInstanceClass } from "../../../utils";
import { Criterion } from "../criterion";

export abstract class NotValueCriterion<T> extends Criterion {
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

import { Class, getInstanceClass } from "../../../utils";
import { ValueCriterion } from "../value-criterion";

// [todo] think about if we want "is-null", "is-not-null", "is-true" and "is-false" to extend from this
export abstract class BinaryCriterion<T> extends ValueCriterion<T> {
    protected abstract inverseClass: Class<BinaryCriterion<T>>;

    reduce(other: ValueCriterion): false | ValueCriterion<T>[] {
        if (other instanceof getInstanceClass(this)) {
            return [];
        }

        return false;
    }

    invert(): ValueCriterion<T>[] {
        return [new this.inverseClass()];
    }
}

import { Class, getInstanceClass } from "../../../utils";
import { ValueCriteria } from "../value-criteria";
import { ValueCriterion } from "../value-criterion";

// [todo] think about if we want "is-null", "is-not-null", "is-true" and "is-false" to extend from this
export abstract class BinaryCriterion<T> extends ValueCriterion<T> {
    protected abstract inverseClass: Class<BinaryCriterion<T>>;

    reduce(other: ValueCriterion): boolean | ValueCriterion<T> {
        if (other instanceof ValueCriteria) {
            return super.reduceValueCriteria(other);
        } else if (other instanceof getInstanceClass(this)) {
            return true;
        }

        return false;
    }

    invert(): ValueCriterion<T> {
        return new this.inverseClass();
    }
}

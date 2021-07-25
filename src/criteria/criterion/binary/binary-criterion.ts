import { Class, getInstanceClass } from "../../../utils";
import { Criteria } from "../criteria";
import { Criterion } from "../criterion";

export abstract class BinaryCriterion<T> extends Criterion<T> {
    protected abstract inverseClass: Class<BinaryCriterion<T>>;

    reduce(other: Criterion): boolean | Criterion<T> {
        if (other instanceof Criteria) {
            return super.reduceValueCriteria(other);
        } else if (other instanceof getInstanceClass(this)) {
            return true;
        }

        return false;
    }

    invert(): Criterion<T> {
        return new this.inverseClass();
    }
}

import { Class, getInstanceClass } from "../../../utils";
import { Criteria } from "../criteria";
import { Criterion } from "../criterion";

export abstract class BinaryCriterion<T> extends Criterion {
    protected abstract inverseClass: Class<BinaryCriterion<T>>;

    reduce(other: Criterion): boolean | Criterion {
        if (other instanceof Criteria) {
            return other.reduceBy(this);
        } else if (other instanceof getInstanceClass(this)) {
            return true;
        }

        return false;
    }

    invert(): Criterion {
        return new this.inverseClass();
    }
}

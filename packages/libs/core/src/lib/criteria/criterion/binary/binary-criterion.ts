import { Class, getInstanceClass } from "@entity-space/utils";
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

    merge(other: Criterion): false | Criterion {
        if (other instanceof getInstanceClass(this)) {
            return this;
        }

        return false;
    }

    intersect(other: Criterion): false | Criterion {
        const selfClass = getInstanceClass(this);

        if (other instanceof selfClass) {
            return new selfClass();
        }

        return false;
    }
}

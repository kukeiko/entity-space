import { any } from "../any/any.fn";
import { Criterion } from "../criterion";

export class NeverCriterion extends Criterion {
    reduce(criterion: Criterion): boolean | Criterion {
        return criterion instanceof NeverCriterion;
    }

    override invert(): false | Criterion {
        return any();
    }

    override merge(other: Criterion): false | Criterion {
        return other;
    }

    override intersect(_: Criterion): false | Criterion {
        return false;
    }

    toString(): string {
        return "never";
    }

    matches(value: any): boolean {
        return false;
    }
}

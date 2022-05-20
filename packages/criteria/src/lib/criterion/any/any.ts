import { Criterion } from "../criterion";

export class AnyCriterion extends Criterion {
    reduce(_: Criterion): boolean | Criterion {
        return true;
    }

    override invert(): false | Criterion {
        // [todo] implement & return "NeverCriterion"
        return false;
    }

    override merge(other: Criterion): false | Criterion {
        return this;
    }

    override intersect(other: Criterion): false | Criterion {
        return other;
    }

    toString(): string {
        return "any";
    }

    matches(value: any): boolean {
        return true;
    }
}

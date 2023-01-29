import { Criterion } from "../criterion";
import { never } from "../never/never.fn";

export class AnyCriterion extends Criterion {
    subtractFrom(_: Criterion): boolean | Criterion {
        return true;
    }

    override invert(): false | Criterion {
        return never();
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

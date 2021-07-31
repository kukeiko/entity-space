import { Criteria } from "./criteria";
import { Criterion } from "./criterion";

export class OrCriteria extends Criteria {
    // [todo] remove "as any" hacks
    reduce(other: Criterion): boolean | Criterion {
        let reduced = other;

        for (const mine of this.items) {
            const result = mine.reduce(reduced);

            if (result === true) {
                return true;
            } else if (result !== false) {
                reduced = result;
            }
        }

        return reduced === other ? false : (reduced as any);
    }

    invert(): Criterion {
        return new OrCriteria(this.items.map(criterion => criterion.invert()));
    }

    toString(): string {
        return `(${this.items.map(item => item.toString()).join(" | ")})`;
    }
}

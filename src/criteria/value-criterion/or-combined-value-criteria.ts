import { ValueCriteria } from "./value-criteria";
import { ValueCriterion } from "./value-criterion";

export class OrCombinedValueCriteria<T = unknown> extends ValueCriteria<T> {
    // [todo] remove "as any" hacks
    reduce(other: ValueCriterion): boolean | ValueCriterion<T> {
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

    invert(): ValueCriterion<T> {
        return new OrCombinedValueCriteria(this.items.map(criterion => criterion.invert()));
    }

    toString(): string {
        return `(${this.items.map(item => item.toString()).join(" | ")})`;
    }
}

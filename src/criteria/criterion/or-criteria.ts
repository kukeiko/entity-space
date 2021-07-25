import { Criteria } from "./criteria";
import { Criterion } from "./criterion";

export class OrCriteria<T = unknown> extends Criteria<T> {
    // [todo] remove "as any" hacks
    reduce(other: Criterion): boolean | Criterion<T> {
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

    invert(): Criterion<T> {
        return new OrCriteria(this.items.map(criterion => criterion.invert()));
    }

    toString(): string {
        return `(${this.items.map(item => item.toString()).join(" | ")})`;
    }
}

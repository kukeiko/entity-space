import { Criteria } from "./criteria";
import { Criterion } from "./criterion";

export class OrCriteria<T extends Criterion = Criterion> extends Criteria<T> {
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

        return reduced === other ? false : reduced;
    }

    reduceBy(other: Criterion): boolean | Criterion {
        const items: Criterion[] = [];
        let didReduceAny = false;

        for (const mine of this.getItems()) {
            const reduced = other.reduce(mine);

            if (reduced === true) {
                didReduceAny = true;
            } else if (reduced !== false) {
                items.push(reduced);
                didReduceAny = true;
            } else {
                items.push(mine);
            }
        }

        if (!didReduceAny) {
            return false;
        }

        return items.length === 0 ? true : items.length === 1 ? items[0] : new OrCriteria(items);
    }

    invert(): Criterion {
        return new OrCriteria(this.items.map(criterion => criterion.invert()));
    }

    toString(): string {
        return `(${this.items.map(item => item.toString()).join(" | ")})`;
    }
}

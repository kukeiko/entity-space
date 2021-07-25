import { AndCriteria } from "./and-criteria";
import { OrCriteria } from "./or-criteria";
import { Criteria } from "./criteria";

export abstract class Criterion<T = unknown> {
    temp!: T; // need this for proper type-safety, otherwise ValueCriterion<number> is assignable to ValueCriterion<string>
    abstract reduce(other: Criterion): boolean | Criterion<T>;
    abstract invert(): Criterion<T>;
    abstract toString(): string;

    protected reduceValueCriteria(valueCriteria: Criteria): boolean | Criterion<T> {
        if (valueCriteria instanceof AndCriteria) {
            const items: Criterion<T>[] = [];
            let didReduceAny = false;

            for (const other of valueCriteria.getItems()) {
                const reduced = this.reduce(other);

                if (reduced === true) {
                    return true;
                } else if (reduced !== false) {
                    items.push(reduced);
                    didReduceAny = true;
                } else {
                    items.push(other);
                }
            }

            if (!didReduceAny) {
                return false;
            }

            return items.length === 1 ? items[0] : new AndCriteria(items);
        } else {
            const items: Criterion<T>[] = [];
            let didReduceAny = false;

            for (const other of valueCriteria.getItems()) {
                const reduced = this.reduce(other);

                if (reduced === true) {
                    didReduceAny = true;
                } else if (reduced !== false) {
                    items.push(reduced);
                    didReduceAny = true;
                } else {
                    items.push(other as any);
                }
            }

            if (!didReduceAny) {
                return false;
            }

            return items.length === 0 ? true : items.length === 1 ? items[0] : new OrCriteria(items);
        }
    }

    // reduceBy(other: ValueCriterion): boolean | ValueCriterion<T> {
    //     return false;
    // }
}

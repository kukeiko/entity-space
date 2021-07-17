import { AndCombinedValueCriteria } from "./and-combined-value-criteria";
import { OrCombinedValueCriteria } from "./or-combined-value-criteria";
import { ValueCriteria } from "./value-criteria";

export abstract class ValueCriterion<T = unknown> {
    temp!: T; // need this for proper type-safety, otherwise ValueCriterion<number> is assignable to ValueCriterion<string>
    abstract reduce(other: ValueCriterion): boolean | ValueCriterion<T>;
    abstract invert(): ValueCriterion<T>;
    abstract toString(): string;

    protected reduceValueCriteria(valueCriteria: ValueCriteria): boolean | ValueCriterion<T> {
        if (valueCriteria instanceof AndCombinedValueCriteria) {
            const items: ValueCriterion<T>[] = [];
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

            return items.length === 1 ? items[0] : new AndCombinedValueCriteria(items);
        } else {
            const items: ValueCriterion<T>[] = [];
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

            return items.length === 0 ? true : items.length === 1 ? items[0] : new OrCombinedValueCriteria(items);
        }
    }

    // reduceBy(other: ValueCriterion): boolean | ValueCriterion<T> {
    //     return false;
    // }
}

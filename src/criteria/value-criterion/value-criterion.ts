import { ValueCriteria } from "./value-criteria";

export abstract class ValueCriterion<T = unknown> {
    temp!: T; // need this for proper type-safety, otherwise ValueCriterion<number> is assignable to ValueCriterion<string>
    abstract reduce(other: ValueCriterion): boolean | ValueCriterion<T>;
    abstract invert(): ValueCriterion<T>;
    abstract toString(): string;

    protected reduceValueCriteria(valueCriteria: ValueCriteria<T>): boolean | ValueCriterion<T> {
        const items: ValueCriterion<T>[] = [];

        for (const other of valueCriteria.getItems()) {
            const reduced = this.reduce(other);

            if (reduced !== true && reduced !== false) {
                items.push(reduced);
            }
        }

        return items.length === 0 ? true : items.length === 1 ? items[0] : new ValueCriteria(items);
    }
}

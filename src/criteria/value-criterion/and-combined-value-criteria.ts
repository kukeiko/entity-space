import { OrCombinedValueCriteria } from "./or-combined-value-criteria";
import { ValueCriteria } from "./value-criteria";
import { ValueCriterion } from "./value-criterion";

export class AndCombinedValueCriteria<T = unknown> extends ValueCriteria<T> {
    // [todo] remove "any" hacks
    reduce(other: ValueCriterion): boolean | ValueCriterion<T> {
        const items: { criterion: ValueCriterion; result: boolean | ValueCriterion }[] = this.items.map(criterion => ({ criterion, result: criterion.reduce(other) }));

        if (items.every(x => x.result === false)) {
            return false;
        } else if (items.every(x => x.result === true)) {
            return true;
        }

        const reduced: ValueCriterion[][] = [];
        const accumulated: ValueCriterion[] = [];

        for (const item of items) {
            if (item.result === true) {
                continue;
            }

            const reducedCriterion = item.result === false ? item.criterion.invert() : item.result;
            reduced.push([...accumulated, reducedCriterion]);
            accumulated.push(item.criterion);
        }

        if (reduced.length === 0) {
            return true;
        }

        return new OrCombinedValueCriteria<any>(reduced.map(foo => (foo.length === 1 ? foo[0] : new AndCombinedValueCriteria(foo))));
    }

    invert(): ValueCriterion<T> {
        return new AndCombinedValueCriteria(this.items.map(criterion => criterion.invert()));
    }

    toString(): string {
        return `(${this.items.map(item => item.toString()).join(" & ")})`;
    }
}

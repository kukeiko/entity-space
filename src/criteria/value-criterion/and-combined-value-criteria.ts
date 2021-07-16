import { OrCombinedValueCriteria } from "./or-combined-value-criteria";
import { ValueCriteria } from "./value-criteria";
import { ValueCriterion } from "./value-criterion";

export class AndCombinedValueCriteria<T = unknown> extends ValueCriteria<T> {
    reduce(other: ValueCriterion): boolean | ValueCriterion<T> {
        let didReduceAny = false;
        const partiallyReduced: ValueCriterion[] = [];
        const notReduced: ValueCriterion[] = [];

        for (const mine of this.items) {
            const nextReduced = mine.reduce(other);

            if (nextReduced === true) {
                didReduceAny = true;
            } else if (nextReduced !== false) {
                didReduceAny = true;
                partiallyReduced.push(nextReduced);
            } else {
                notReduced.push(other);
            }
        }

        if (!didReduceAny) {
            return false;
        } else if (partiallyReduced.length === 0) {
            return true;
        } else if (notReduced.length === 0) {
            if (partiallyReduced.length === 1) {
                return partiallyReduced[0] as any;
            } else {
                return new OrCombinedValueCriteria(partiallyReduced as any);
            }
        } else {
            // [todo] stopped here
        }

        throw new Error("NotImplemented");
    }

    toString(): string {
        if (this.items.length === 1) {
            // [todo] maybe we still want to render brackets? (now that a value-criterion is no longer required to be nested in value-criteria for entity-criterion)
            return this.items[0].toString();
        }

        return `(${this.items.map(item => item.toString()).join(" & ")})`;
    }
}

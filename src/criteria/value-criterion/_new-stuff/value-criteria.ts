import { ValueCriterion } from "./value-criterion";

export class ValueCriteria<T> {
    constructor(valueType: () => T, items: ValueCriterion<T>[]) {
        this.valueType = valueType;
        this.items = items;
    }

    readonly valueType: () => T;
    readonly items: ValueCriterion<T>[];

    isOtherCompatibleWithMe(other: ValueCriteria<unknown>): other is ValueCriteria<T> {
        return other.valueType === this.valueType;
    }

    reduce(other: ValueCriteria<T>): ValueCriteria<T> | false;
    reduce(other: ValueCriteria<unknown>): ValueCriteria<ReturnType<typeof other["valueType"]>> | false {
        if (!this.isOtherCompatibleWithMe(other)) {
            return false;
        }

        if (this.items.length === 0 || other.items.length === 0) {
            return new ValueCriteria(this.valueType, []);
        }

        let reduced = other.items.slice();
        let didReduceAny = false;

        // for each criterion in B, pick each criterion in A and try to reduce it.
        // criteria in A are updated with the reduced results as we go.
        for (const criterionB of this.items) {
            const nextReduced: ValueCriterion<T>[] = [];

            for (const criterionA of reduced) {
                const reducedCriteria = criterionB.reduce(criterionA);

                if (reducedCriteria) {
                    nextReduced.push(...reducedCriteria);
                    didReduceAny = true;
                } else {
                    nextReduced.push(criterionA);
                }
            }

            reduced = nextReduced;
        }

        return didReduceAny ? new ValueCriteria(this.valueType, reduced) : false;
    }

    invert(): ValueCriteria<T> {
        const inverted: ValueCriterion<T>[] = [];

        for (const criterion of this.items) {
            inverted.push(...criterion.invert());
        }

        return new ValueCriteria(this.valueType, inverted);
    }

    toString(): string {
        if (this.items.length === 1) {
            return this.items[0].toString();
        }

        return `(${this.items.map(item => item.toString()).join(" | ")})`;
    }
}

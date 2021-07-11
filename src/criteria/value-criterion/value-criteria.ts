import { ValueCriterion } from "./value-criterion";

export class ValueCriteria<T = unknown> {
    constructor(items: ValueCriterion<T>[]) {
        this.items = Object.freeze(items);
    }

    readonly items: readonly ValueCriterion<T>[];

    getItems(): readonly ValueCriterion<T>[] {
        return this.items;
    }

    // [todo] remove "as any" hacks
    reduce(other: ValueCriteria<unknown>): false | ValueCriteria<T> {
        if (this.items.length === 0 || other.items.length === 0) {
            return new ValueCriteria([]);
        }

        let reduced = other.items.slice();
        let didReduceAny = false;

        // for each criterion in B, pick each criterion in A and try to reduce it.
        // criteria in A are updated with the reduced results as we go.
        for (const criterionB of this.items) {
            const nextReduced: ValueCriterion<unknown>[] = [];

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

        return didReduceAny ? (new ValueCriteria(reduced) as any) : false;
    }

    invert(): ValueCriteria<T> {
        const inverted: ValueCriterion<T>[] = [];

        for (const criterion of this.items) {
            inverted.push(...criterion.invert());
        }

        return new ValueCriteria(inverted);
    }

    toString(): string {
        if (this.items.length === 1) {
            return this.items[0].toString();
        }

        return `(${this.items.map(item => item.toString()).join(" | ")})`;
    }
}

import { ObjectCriterion } from "./object-criterion";

export class Criteria<T = unknown> {
    constructor(items: ObjectCriterion<T>[]) {
        this.items = items;
    }

    readonly items: ObjectCriterion<T>[];

    reduce(other: Criteria<T>): Criteria<T> | false {
        if (this.items.length === 0 && other.items.length === 0) {
            return new Criteria<T>([]);
        }

        let reduced = other.items.slice();
        let didReduceAny = false;

        // for each criterion in B, pick each criterion in A and try to reduce it.
        // criteria in A are updated with the reduced results as we go.
        for (const criterionB of this.items) {
            const nextReduced: ObjectCriterion<T>[] = [];

            for (const criterionA of reduced) {
                const reducedCriteria = criterionB.reduce(criterionA);

                if (reducedCriteria) {
                    nextReduced.push(...reducedCriteria.items);
                    didReduceAny = true;
                } else {
                    nextReduced.push(criterionA);
                }
            }

            reduced = nextReduced;
        }

        return didReduceAny ? new Criteria(reduced) : false;
    }

    toString(): string {
        if (this.items.length === 1) {
            return this.items[0].toString();
        }

        return `(${this.items.map(item => item.toString()).join(" | ")})`;
    }

    // invert(): ValueCriteria<T> {
    //     const inverted: ValueCriterion<T>[] = [];

    //     for (const criterion of this.items) {
    //         inverted.push(...criterion.invert());
    //     }

    //     return new ValueCriteria(this.valueType, inverted);
    // }
}

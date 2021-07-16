import { ValueCriterion } from "./value-criterion";

export class ValueCriteria<T = unknown> extends ValueCriterion<T> {
    constructor(items: ValueCriterion<T>[]) {
        super();
        this.items = items;
    }

    readonly items: ValueCriterion<T>[];

    getItems(): ValueCriterion<T>[] {
        return this.items;
    }

    // [todo] remove "as any" hacks
    reduce(other: ValueCriterion): boolean | ValueCriterion<T> {
        let reduced = other; //.items.slice();
        let didReduceAny = false;

        // for each criterion in B, pick each criterion in A and try to reduce it.
        // criteria in A are updated with the reduced results as we go.
        for (const criterionB of this.items) {
            const nextReduced = criterionB.reduce(reduced);

            if (nextReduced === true) {
                return true;
            } else if (nextReduced !== false) {
                didReduceAny = true;
                reduced = nextReduced;
            }
        }

        return didReduceAny ? (reduced as any) : false;
    }

    // [todo] remove "as any" hacks
    // reduceBy(other: ValueCriterion): boolean | ValueCriterion<T> {
    //     const items: ValueCriterion<T>[] = [];
    //     let didReduceAny = false;

    //     for (const mine of this.getItems()) {
    //         const reduced = other.reduce(mine);

    //         if (reduced === true) {
    //             didReduceAny = true;
    //         } else if (reduced !== false) {
    //             items.push(reduced as any);
    //             didReduceAny = true;
    //         }
    //     }

    //     if (!didReduceAny) {
    //         return false;
    //     }

    //     return items.length === 0 ? true : items.length === 1 ? items[0] : new ValueCriteria(items);
    // }

    invert(): ValueCriterion<T> {
        const inverted: ValueCriterion<T>[] = [];

        for (const criterion of this.items) {
            inverted.push(criterion.invert());
        }

        return new ValueCriteria(inverted);
    }

    toString(): string {
        if (this.items.length === 1) {
            // [todo] maybe we still want to render brackets? (now that a value-criterion is no longer required to be nested in value-criteria for entity-criterion)
            return this.items[0].toString();
        }

        return `(${this.items.map(item => item.toString()).join(" | ")})`;
    }
}

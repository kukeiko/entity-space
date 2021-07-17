import { ValueCriterion } from "./value-criterion";

export abstract class ValueCriteria<T = unknown> extends ValueCriterion<T> {
    constructor(items: ValueCriterion<T>[]) {
        super();
        this.items = items;
    }

    readonly items: ValueCriterion<T>[];

    getItems(): ValueCriterion<T>[] {
        return this.items;
    }
}

import { Criterion } from "./criterion";

export abstract class Criteria<T extends Criterion = Criterion> extends Criterion {
    constructor(items: T[]) {
        super();

        if (items.length === 0) {
            throw new Error(`can not create empty property criteria`);
        }

        this.items = items;
    }

    readonly items: T[];

    getItems(): T[] {
        return this.items;
    }

    abstract reduceBy(other: Criterion): boolean | Criterion;
}

import { Criterion } from "./criterion";

export abstract class Criteria<T = unknown> extends Criterion<T> {
    constructor(items: Criterion<T>[]) {
        super();
        this.items = items;
    }

    readonly items: Criterion<T>[];

    getItems(): Criterion<T>[] {
        return this.items;
    }
}

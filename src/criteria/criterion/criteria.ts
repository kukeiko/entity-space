import { Criterion } from "./criterion";

export abstract class Criteria extends Criterion {
    constructor(items: Criterion[]) {
        super();
        this.items = items;
    }

    readonly items: Criterion[];

    getItems(): Criterion[] {
        return this.items;
    }
}

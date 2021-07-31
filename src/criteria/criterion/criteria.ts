import { Class, getInstanceClass, isInstanceOf } from "../../utils";
import { Criterion } from "./criterion";

export abstract class Criteria<T extends Criterion = Criterion> extends Criterion {
    constructor(items: T[]) {
        super();
        this.items = items;
    }

    readonly items: T[];

    getItems(): T[] {
        return this.items;
    }

    invert(): false | Criterion {
        const inverted = this.items.map(criterion => criterion.invert());
        const selfClass = getInstanceClass(this);

        if (inverted.every(isInstanceOf(Criterion))) {
            return new selfClass(inverted);
        }

        return false;
    }

    abstract reduceBy(other: Criterion): boolean | Criterion;
}

import { ValueCriterion } from "../value-criterion";

export abstract class NotInSetCriterion<T> extends ValueCriterion<T> {
    constructor(values: Iterable<T>) {
        super();
        this.values = new Set(values);
    }

    protected readonly values: Set<T>;

    getValues(): ReadonlySet<T> {
        return this.values;
    }

    toString(): string {
        return `!{${Array.from(this.values).join(", ")}}`;
    }
}

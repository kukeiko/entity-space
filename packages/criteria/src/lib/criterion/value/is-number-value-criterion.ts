import { IsValueCriterion } from "./is-value-criterion";

export class IsNumberValueCriterion extends IsValueCriterion<number> {
    constructor(value: number) {
        super(value);
    }

    toString(): string {
        return `is ${this.value}`;
    }
}

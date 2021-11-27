import { IsValueCriterion } from "./is-value-criterion";

export class IsStringValueCriterion extends IsValueCriterion<string> {
    constructor(value: string) {
        super(value);
    }

    toString(): string {
        return `is "${this.value}""`;
    }
}

import { NotValueCriterion } from "./not-value-criterion";

export class NotStringValueCriterion extends NotValueCriterion<string> {
    constructor(value: string) {
        super(value);
    }

    toString(): string {
        return `not "${this.value}""`;
    }
}

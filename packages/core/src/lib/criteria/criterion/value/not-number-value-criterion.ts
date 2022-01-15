import { NotValueCriterion } from "./not-value-criterion";

export class NotNumberValueCriterion extends NotValueCriterion<number> {
    constructor(value: number) {
        super(value);
    }

    toString(): string {
        return `not ${this.value}`;
    }
}

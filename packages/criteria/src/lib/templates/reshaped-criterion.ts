import { Criterion } from "../criterion/criterion";

// [todo] consider renaming to "RemappedCriterion", as this was the term i used for searching this file
// after taking a break from the project
export class ReshapedCriterion<T extends Criterion = Criterion> {
    constructor(criteria: T[], open?: Criterion[]) {
        this.criteria = criteria;
        this.open = open ?? [];
    }

    private readonly criteria: T[];
    private readonly open: Criterion[];

    getReshaped(): T[] {
        return this.criteria;
    }

    getOpen(): Criterion[] {
        return this.open;
    }
}

import { Criterion } from "../criterion/criterion";

export class RemapCriterionResult<T extends Criterion = Criterion> {
    constructor(criteria: T[], open?: Criterion[]) {
        this.criteria = criteria;
        this.open = open ?? [];
    }

    private readonly criteria: T[];
    private readonly open: Criterion[];

    getCriteria(): T[] {
        return this.criteria;
    }

    getOpen(): Criterion[] {
        return this.open;
    }
}

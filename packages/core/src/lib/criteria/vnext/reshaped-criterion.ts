import { ICriterion } from "./criterion.interface";

export class ReshapedCriterion<T extends ICriterion> {
    constructor(reshaped: T[], open?: ICriterion[]) {
        this.reshaped = reshaped;
        this.open = open ?? [];
    }

    private readonly reshaped: T[];
    private readonly open: ICriterion[];

    getReshaped(): T[] {
        return this.reshaped;
    }

    getOpen(): ICriterion[] {
        return this.open;
    }
}

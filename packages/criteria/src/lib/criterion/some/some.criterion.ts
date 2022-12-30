import { Criterion } from "../criterion";

export class SomeCriterion<T extends Criterion = Criterion> extends Criterion {
    constructor(criterion: T) {
        super();
        this.criterion = criterion;
    }

    private readonly criterion: T;

    subtractFrom(other: Criterion): boolean | Criterion {
        if (!(other instanceof SomeCriterion)) {
            return false;
        }

        const subtracted = this.criterion.subtractFrom(other.criterion);

        if (typeof subtracted == "boolean") {
            return subtracted;
        }

        return new SomeCriterion(subtracted);
    }

    override intersect(other: Criterion): false | Criterion {
        if (!(other instanceof SomeCriterion)) {
            return false;
        }

        const intersected = this.criterion.intersect(other.criterion);

        if (typeof intersected == "boolean") {
            return intersected;
        }

        return new SomeCriterion(intersected);
    }

    toString(): string {
        return `some(${this.criterion})`;
    }

    matches(value: any): boolean {
        if (!Array.isArray(value)) {
            return false;
        }

        return value.some(item => this.criterion.matches(item));
    }

    getItem(): T {
        return this.criterion;
    }
}

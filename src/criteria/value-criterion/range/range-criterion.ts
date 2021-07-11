import { ValueCriterion } from "../value-criterion";

export type FromCriterion<T> = {
    op: ">=" | ">";
    value: T;
};

export type ToCriterion<T> = {
    op: "<=" | "<";
    value: T;
};

export abstract class RangeCriterion<T> extends ValueCriterion<T> {
    constructor(values: [T | undefined, T | undefined], inclusive: boolean | [boolean, boolean] = true) {
        super();

        if (typeof inclusive === "boolean") {
            inclusive = [inclusive, inclusive];
        }

        if (values[0] !== void 0) {
            this.from = {
                op: inclusive[0] ? ">=" : ">",
                value: values[0],
            };
        } else {
            this.from = null;
        }

        if (values[1] !== void 0) {
            this.to = {
                op: inclusive[1] ? "<=" : "<",
                value: values[1],
            };
        } else {
            this.to = null;
        }
    }

    protected readonly from: FromCriterion<T> | null;
    protected readonly to: ToCriterion<T> | null;

    getFrom(): FromCriterion<T> | null {
        return this.from;
    }

    getTo(): ToCriterion<T> | null {
        return this.to;
    }

    toString(): string {
        const shards: string[] = [];

        if (this.from === null) {
            shards.push("[...");
        } else if (this.from.op === ">") {
            shards.push(`(${this.from.value}`);
        } else {
            shards.push(`[${this.from.value}`);
        }

        if (this.to === null) {
            shards.push("...]");
        } else if (this.to.op === "<") {
            shards.push(`${this.to.value})`);
        } else {
            shards.push(`${this.to.value}]`);
        }

        return shards.join(", ");
    }

    static isFromBiggerThanFrom<T>(a: FromCriterion<T>, b: FromCriterion<T> | null): boolean {
        if (b === null) {
            return true;
        } else if (a.op === ">=" && b.op === ">") {
            return a.value > b.value;
        } else {
            return a.value >= b.value;
        }
    }

    static isFromSmallerThanTo<T>(a: FromCriterion<T>, b: ToCriterion<T> | null): boolean {
        if (b === null) {
            return true;
        } else if (a.op === ">=" && b.op === "<=") {
            return a.value <= b.value;
        } else {
            return a.value < b.value;
        }
    }

    static isFromInsideFromTo<T>(a: FromCriterion<T>, b: RangeCriterion<T>): boolean {
        return this.isFromBiggerThanFrom(a, b.getFrom()) && this.isFromSmallerThanTo(a, b.getTo());
    }

    isFromInsideFromTo(a: FromCriterion<T>): boolean {
        return RangeCriterion.isFromBiggerThanFrom(a, this.getFrom()) && RangeCriterion.isFromSmallerThanTo(a, this.getTo());
    }

    static isToBiggerThanFrom<T>(a: ToCriterion<T>, b: FromCriterion<T> | null): boolean {
        if (b === null) {
            return true;
        } else if (a.op === "<=" && b.op === ">=") {
            return a.value >= b.value;
        } else {
            return a.value > b.value;
        }
    }

    static isToSmallerThanTo<T>(a: ToCriterion<T>, b: ToCriterion<T> | null): boolean {
        if (b === null) {
            return true;
        } else if (a.op === "<=" && b.op === "<") {
            return a.value < b.value;
        } else {
            return a.value <= b.value;
        }
    }

    static isToInsideFromTo<T>(a: ToCriterion<T>, b: RangeCriterion<T>): boolean {
        return this.isToBiggerThanFrom(a, b.getFrom()) && this.isToSmallerThanTo(a, b.getTo());
    }

    isToInsideFromTo(a: ToCriterion<T>): boolean {
        return RangeCriterion.isToBiggerThanFrom(a, this.getFrom()) && RangeCriterion.isToSmallerThanTo(a, this.getTo());
    }
}

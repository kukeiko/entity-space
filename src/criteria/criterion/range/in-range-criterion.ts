import { Class, getInstanceClass } from "../../../utils";
import { OrCriteria } from "../or-criteria";
import { Criteria } from "../criteria";
import { Criterion } from "../criterion";

export type FromCriterion<T> = {
    op: ">=" | ">";
    value: T;
};

export type ToCriterion<T> = {
    op: "<=" | "<";
    value: T;
};

export abstract class InRangeCriterion<T> extends Criterion {
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

        this.selfClass = getInstanceClass(this);
    }

    private readonly selfClass: Class<this>;
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

    static isFromInsideFromTo<T>(a: FromCriterion<T>, b: InRangeCriterion<T>): boolean {
        return this.isFromBiggerThanFrom(a, b.getFrom()) && this.isFromSmallerThanTo(a, b.getTo());
    }

    isFromInsideFromTo(a: FromCriterion<T>): boolean {
        return InRangeCriterion.isFromBiggerThanFrom(a, this.getFrom()) && InRangeCriterion.isFromSmallerThanTo(a, this.getTo());
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

    static isToInsideFromTo<T>(a: ToCriterion<T>, b: InRangeCriterion<T>): boolean {
        return this.isToBiggerThanFrom(a, b.getFrom()) && this.isToSmallerThanTo(a, b.getTo());
    }

    isToInsideFromTo(a: ToCriterion<T>): boolean {
        return InRangeCriterion.isToBiggerThanFrom(a, this.getFrom()) && InRangeCriterion.isToSmallerThanTo(a, this.getTo());
    }

    reduce(other: Criterion): boolean | Criterion {
        if (other instanceof Criteria) {
            return other.reduceBy(this);
        } else if (other instanceof this.selfClass) {
            const otherFrom = other.getFrom();
            const otherTo = other.getTo();
            const selfFrom = this.getFrom();
            const selfTo = this.getTo();

            if (otherFrom !== null && otherTo !== null) {
                const fromInside = this.isFromInsideFromTo(otherFrom);
                const toInside = this.isToInsideFromTo(otherTo);

                if (fromInside && toInside) {
                    return true;
                } else if (fromInside) {
                    if (selfTo === null) {
                        // [todo] this code path should never be hit because if selfTo === null, and fromInside is true, then toInside has to be true as well.
                        // we either throw an error or restructure the code so that we won't end up in impossible code paths
                    } else {
                        return new this.selfClass([selfTo.value, otherTo.value], [selfTo.op === "<", otherTo.op === "<="]);
                    }
                } else if (toInside) {
                    if (selfFrom === null) {
                        // [todo] this code path should never be hit because if selfFrom === null, and toInside is true, then fromInside has to be true as well.
                        // we either throw an error or restructure the code so that we won't end up in impossible code paths
                    } else {
                        return new this.selfClass([otherFrom.value, selfFrom.value], [otherFrom.op === ">=", selfFrom.op === ">"]);
                    }
                } else if (selfFrom !== null && selfTo !== null) {
                    const fromInside = InRangeCriterion.isFromInsideFromTo(selfFrom, other);
                    const toInside = InRangeCriterion.isToInsideFromTo(selfTo, other);

                    if (fromInside && toInside) {
                        return new OrCriteria([
                            new this.selfClass([otherFrom.value, selfFrom.value], [otherFrom.op === ">=", selfFrom.op === ">"]),
                            new this.selfClass([selfTo.value, otherTo.value], [selfTo.op === "<", otherTo.op === "<="]),
                        ]);
                    }
                }
            } else if (otherFrom !== null) {
                if (this.isFromInsideFromTo(otherFrom)) {
                    if (selfTo === null) {
                        return true;
                    } else {
                        return new this.selfClass([selfTo.value, void 0], selfTo.op === "<");
                    }
                } else if (selfFrom !== null && selfTo !== null) {
                    const fromInside = this.isFromInsideFromTo(selfFrom);
                    const toInside = this.isToInsideFromTo(selfTo);

                    if (fromInside && toInside) {
                        return new OrCriteria([
                            new this.selfClass([otherFrom.value, selfFrom.value], [otherFrom.op === ">=", selfFrom.op === ">"]),
                            new this.selfClass([selfTo.value, void 0], selfTo.op === "<"),
                        ]);
                    }
                }
            } else if (otherTo !== null) {
                if (this.isToInsideFromTo(otherTo)) {
                    if (selfFrom === null) {
                        return true;
                    } else {
                        return new this.selfClass([void 0, selfFrom.value], selfFrom.op === ">");
                    }
                } else if (selfFrom !== null && selfTo !== null) {
                    const fromInside = this.isFromInsideFromTo(selfFrom);
                    const toInside = this.isToInsideFromTo(selfTo);

                    if (fromInside && toInside) {
                        return new OrCriteria([
                            new this.selfClass([void 0, selfFrom.value], selfFrom.op === ">"),
                            new this.selfClass([selfTo.value, otherTo.value], [selfTo.op === "<", otherTo.op === "<="]),
                        ]);
                    }
                }
            } else {
                // [todo] ???
            }

            return false;
        }

        return false;
    }

    invert(): Criterion {
        const inverted: Criterion[] = [];

        if (this.from?.op !== void 0) {
            inverted.push(new this.selfClass([void 0, this.from.value], this.from.op === ">"));
        }

        if (this.to?.op !== void 0) {
            inverted.push(new this.selfClass([this.to.value, void 0], this.to.op === "<"));
        }

        return new OrCriteria(inverted);
    }
}

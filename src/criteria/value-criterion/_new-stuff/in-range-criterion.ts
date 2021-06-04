import { ValueCriterion } from "./value-criterion";
import { inRange } from "../in-range";

export type FromCriterion<T extends number | string> = {
    op: ">=" | ">";
    value: T;
};

export type ToCriterion<T extends number | string> = {
    op: "<=" | "<";
    value: T;
};

export class InRangeCriterion<T extends number | string> implements ValueCriterion<T> {
    constructor(valueType: () => T, values: [T | undefined, T | undefined], inclusive: boolean | [boolean, boolean] = true) {
        this.valueType = valueType;

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

    private readonly from: FromCriterion<T> | null;
    private readonly to: ToCriterion<T> | null;

    static is<T extends string | number>(x: unknown, valueType: () => T): x is InRangeCriterion<T> {
        return x instanceof InRangeCriterion && x.valueType === valueType;
    }

    // static is<T extends string | number>(x: unknown, valueType: Primitive): x is InRangeCriterion<T> {
    //     return x instanceof InRangeCriterion && (valueType === Number || valueType === String) && x.valueType === valueType;
    // }

    static supportsValueType(x: unknown): x is () => string | number {
        return x === String || x === Number;
    }

    static tmp_fromOldFormat(old: ReturnType<typeof inRange>): InRangeCriterion<any> {
        return new InRangeCriterion(Number, [old.from?.value, old.to?.value], [old.from?.op === ">=", old.to?.op === "<="]);
    }

    tmp_toOldFormat(): ReturnType<typeof inRange> {
        const selfFrom = this.getFrom();
        const selfTo = this.getTo();

        return inRange(
            [selfFrom === null ? void 0 : selfFrom.value, selfTo === null ? void 0 : selfTo.value],
            [selfFrom === null ? false : selfFrom.op === ">=", selfTo === null ? false : selfTo.op === "<="]
        );
    }

    getFrom(): FromCriterion<T> | null {
        return this.from;
    }

    getTo(): ToCriterion<T> | null {
        return this.to;
    }

    valueType: () => T;

    reduce(other: ValueCriterion<T>): ValueCriterion<T>[] | false;
    reduce(other: ValueCriterion<unknown>): ValueCriterion<ReturnType<typeof other["valueType"]>>[] | false {
        // [todo] changing "this.valueType" to just "Number" causes errors, which is good - is there a way to verify it via a test?
        if (InRangeCriterion.is(other, this.valueType)) {
            const otherFrom = other.getFrom();
            const otherTo = other.getTo();
            const selfFrom = this.getFrom();
            const selfTo = this.getTo();

            if (otherFrom !== null && otherTo !== null) {
                const fromInside = isFromInsideFromTo(otherFrom, this);
                const toInside = isToInsideFromTo(otherTo, this);

                if (fromInside && toInside) {
                    return [];
                } else if (fromInside) {
                    if (selfTo === null) {
                        // [todo] this code path should never be hit because if selfTo === null, and fromInside is true, then toInside has to be true as well.
                        // we either throw an error or restructure the code so that we won't end up in impossible code paths
                    } else {
                        return [new InRangeCriterion(other.valueType, [selfTo.value, otherTo.value], [selfTo.op === "<", otherTo.op === "<="])];
                    }
                } else if (toInside) {
                    if (selfFrom === null) {
                        // [todo] this code path should never be hit because if selfFrom === null, and toInside is true, then fromInside has to be true as well.
                        // we either throw an error or restructure the code so that we won't end up in impossible code paths
                    } else {
                        return [new InRangeCriterion(other.valueType, [otherFrom.value, selfFrom.value], [otherFrom.op === ">=", selfFrom.op === ">"])];
                    }
                } else if (selfFrom !== null && selfTo !== null) {
                    const fromInside = isFromInsideFromTo(selfFrom, other);
                    const toInside = isToInsideFromTo(selfTo, other);

                    if (fromInside && toInside) {
                        return [
                            new InRangeCriterion(other.valueType, [otherFrom.value, selfFrom.value], [otherFrom.op === ">=", selfFrom.op === ">"]),
                            new InRangeCriterion(other.valueType, [selfTo.value, otherTo.value], [selfTo.op === "<", otherTo.op === "<="]),
                        ];
                    }
                }
            } else if (otherFrom !== null) {
                if (isFromInsideFromTo(otherFrom, this)) {
                    if (selfTo === null) {
                        return [];
                    } else {
                        return [new InRangeCriterion(other.valueType, [selfTo.value, void 0], selfTo.op === "<")];
                    }
                } else if (selfFrom !== null && selfTo !== null) {
                    const fromInside = isFromInsideFromTo(selfFrom, other);
                    const toInside = isToInsideFromTo(selfTo, other);

                    if (fromInside && toInside) {
                        return [
                            new InRangeCriterion(other.valueType, [otherFrom.value, selfFrom.value], [otherFrom.op === ">=", selfFrom.op === ">"]),
                            new InRangeCriterion(other.valueType, [selfTo.value, void 0], selfTo.op === "<"),
                        ];
                    }
                }
            } else if (otherTo !== null) {
                if (isToInsideFromTo(otherTo, this)) {
                    if (selfFrom === null) {
                        return [];
                    } else {
                        return [new InRangeCriterion(other.valueType, [void 0, selfFrom.value], selfFrom.op === ">")];
                    }
                } else if (selfFrom !== null && selfTo !== null) {
                    const fromInside = isFromInsideFromTo(selfFrom, other);
                    const toInside = isToInsideFromTo(selfTo, other);

                    if (fromInside && toInside) {
                        return [
                            new InRangeCriterion(other.valueType, [void 0, selfFrom.value], selfFrom.op === ">"),
                            new InRangeCriterion(other.valueType, [selfTo.value, otherTo.value], [selfTo.op === "<", otherTo.op === "<="]),
                        ];
                    }
                }
            } else {
                // [todo] ???
            }

            return false;
        }

        return false;
    }

    invert(): ValueCriterion<T>[] {
        const inverted: ValueCriterion<T>[] = [];

        if (this.from?.op !== void 0) {
            inverted.push(new InRangeCriterion(this.valueType, [void 0, this.from.value], this.from.op === ">"));
        }

        if (this.to?.op !== void 0) {
            inverted.push(new InRangeCriterion(this.valueType, [this.to.value, void 0], this.to.op === "<"));
        }

        return inverted;
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
}

function isFromBiggerThanFrom<T extends number | string>(a: FromCriterion<T>, b: FromCriterion<T> | null): boolean {
    if (b === null) {
        return true;
    } else if (a.op === ">=" && b.op === ">") {
        return a.value > b.value;
    } else {
        return a.value >= b.value;
    }
}

function isFromSmallerThanTo<T extends number | string>(a: FromCriterion<T>, b: ToCriterion<T> | null): boolean {
    if (b === null) {
        return true;
    } else if (a.op === ">=" && b.op === "<=") {
        return a.value <= b.value;
    } else {
        return a.value < b.value;
    }
}

function isFromInsideFromTo<T extends number | string>(a: FromCriterion<T>, b: InRangeCriterion<T>): boolean {
    return isFromBiggerThanFrom(a, b.getFrom()) && isFromSmallerThanTo(a, b.getTo());
}

function isToBiggerThanFrom<T extends number | string>(a: ToCriterion<T>, b: FromCriterion<T> | null): boolean {
    if (b === null) {
        return true;
    } else if (a.op === "<=" && b.op === ">=") {
        return a.value >= b.value;
    } else {
        return a.value > b.value;
    }
}

function isToSmallerThanTo<T extends number | string>(a: ToCriterion<T>, b: ToCriterion<T> | null): boolean {
    if (b === null) {
        return true;
    } else if (a.op === "<=" && b.op === "<") {
        return a.value < b.value;
    } else {
        return a.value <= b.value;
    }
}

function isToInsideFromTo<T extends number | string>(a: ToCriterion<T>, b: InRangeCriterion<T>): boolean {
    return isToBiggerThanFrom(a, b.getFrom()) && isToSmallerThanTo(a, b.getTo());
}

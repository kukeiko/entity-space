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

    reduce(other: ValueCriterion<T | null>): ValueCriterion<T>[] | false {
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
                        // if (selfTo.op === "<=") {
                        //     return [{ op: "range", from: { op: ">", value: b.to.value }, to: { op: a.to.op, value: a.to.value } }];
                        // } else {
                        //     return [{ op: "range", from: { op: ">=", value: b.to.value }, to: { op: a.to.op, value: a.to.value } }];
                        // }

                        return [new InRangeCriterion(other.valueType, [selfTo.value, otherTo.value], [selfTo.op === "<", otherTo.op === "<="])];
                    }
                } else if (toInside) {
                    if (selfFrom === null) {
                        // [todo] this code path should never be hit because if selfFrom === null, and toInside is true, then fromInside has to be true as well.
                        // we either throw an error or restructure the code so that we won't end up in impossible code paths
                    } else {
                        // if (selfFrom.op === ">=") {
                        //     return [{ op: "range", from: { op: otherFrom.op, value: otherFrom.value }, to: { op: "<", value: selfFrom.value } }];
                        // } else {
                        //     return [{ op: "range", from: { op: otherFrom.op, value: otherFrom.value }, to: { op: "<=", value: selfFrom.value } }];
                        // }

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

                        // const result: ValueCriterion<T>[] = [];

                        // if (selfFrom.op === ">") {
                        //     result.push(new InRangeCriterion(other.valueType, [otherFrom.value, selfFrom.value], [otherFrom.op === ">=", true]));
                        //     // result.push({ op: "range", from: { ...otherFrom }, to: { op: "<=", value: selfFrom.value } });
                        // } else {
                        //     result.push(new InRangeCriterion(other.valueType, [otherFrom.value, selfFrom.value], [otherFrom.op === ">=", false]));
                        //     // result.push({ op: "range", from: { ...otherFrom }, to: { op: "<", value: selfFrom.value } });
                        // }

                        // if (selfTo.op === "<") {
                        //     result.push(new InRangeCriterion(other.valueType, [selfTo.value, otherTo.value], [true, otherTo.op === "<="]));
                        //     // result.push({ op: "range", from: { op: ">=", value: selfTo.value }, to: { ...a.to } });
                        // } else {
                        //     result.push(new InRangeCriterion(other.valueType, [selfTo.value, otherTo.value], [false, otherTo.op === "<="]));
                        //     // result.push({ op: "range", from: { op: ">", value: selfTo.value }, to: { ...a.to } });
                        // }

                        // return result;
                    }
                }
            } else if (otherFrom !== null) {
                if (isFromInsideFromTo(otherFrom, this)) {
                    if (selfTo === null) {
                        return [];
                    } else {
                        // if (selfTo.op === "<=") {
                        //     return [{ op: "range", from: { op: ">", value: selfTo.value } }];
                        // } else {
                        //     return [{ op: "range", from: { op: ">=", value: selfTo.value } }];
                        // }

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

                        // const result: ValueCriterion<T>[] = [];

                        // if (selfFrom.op === ">") {
                        //     result.push({ op: "range", from: { ...otherFrom }, to: { op: "<=", value: selfFrom.value } });
                        // } else {
                        //     result.push({ op: "range", from: { ...otherFrom }, to: { op: "<", value: selfFrom.value } });
                        // }

                        // if (selfTo.op === "<") {
                        //     result.push({ op: "range", from: { op: ">=", value: selfTo.value } });
                        // } else {
                        //     result.push({ op: "range", from: { op: ">", value: selfTo.value } });
                        // }

                        // return result;
                    }
                }
            } else if (otherTo !== null) {
                if (isToInsideFromTo(otherTo, this)) {
                    if (selfFrom === null) {
                        return [];
                    } else {
                        // if (selfFrom.op === ">=") {
                        //     return [{ op: "range", to: { op: "<", value: selfFrom.value } }];
                        // } else {
                        //     return [{ op: "range", to: { op: "<=", value: selfFrom.value } }];
                        // }

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
                        // const result: ValueCriterion<T>[] = [];

                        // if (selfFrom.op === ">") {
                        //     result.push({ op: "range", to: { op: "<=", value: selfFrom.value } });
                        // } else {
                        //     result.push({ op: "range", to: { op: "<", value: selfFrom.value } });
                        // }

                        // if (selfTo.op === "<") {
                        //     result.push({ op: "range", from: { op: ">=", value: selfTo.value }, to: { ...a.to } });
                        // } else {
                        //     result.push({ op: "range", from: { op: ">", value: selfTo.value }, to: { ...a.to } });
                        // }

                        // return result;
                    }
                }
            } else {
                // [todo] ???
            }

            return false;
        }

        return false;
    }

    // getFrom()
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

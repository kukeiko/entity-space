import { FromToValueCriterion } from "./from-to-value-criterion";
import { ValueCriterion } from "../value-criterion";
import { FromCriterion } from "./from-criterion";
import { ToCriterion } from "./to-criterion";

function isFromBiggerThanFrom(a: FromCriterion, b?: FromCriterion): boolean {
    if (b === void 0) {
        return true;
    } else if (a.op === ">=" && b.op === ">") {
        return a.value > b.value;
    } else {
        return a.value >= b.value;
    }
}

function isFromSmallerThanTo(a: FromCriterion, b?: ToCriterion): boolean {
    if (b === void 0) {
        return true;
    } else if (a.op === ">=" && b.op === "<=") {
        return a.value <= b.value;
    } else {
        return a.value < b.value;
    }
}

export function isFromInsideFromTo(a: FromCriterion, b: FromToValueCriterion): boolean {
    return isFromBiggerThanFrom(a, b.from) && isFromSmallerThanTo(a, b.to);
}

function isToBiggerThanFrom(a: ToCriterion, b?: FromCriterion): boolean {
    if (b === void 0) {
        return true;
    } else if (a.op === "<=" && b.op === ">=") {
        return a.value >= b.value;
    } else {
        return a.value > b.value;
    }
}

function isToSmallerThanTo(a: ToCriterion, b?: ToCriterion): boolean {
    if (b === void 0) {
        return true;
    } else if (a.op === "<=" && b.op === "<") {
        return a.value < b.value;
    } else {
        return a.value <= b.value;
    }
}

export function isToInsideFromTo(a: ToCriterion, b: FromToValueCriterion): boolean {
    return isToBiggerThanFrom(a, b.from) && isToSmallerThanTo(a, b.to);
}

export function reduceFromToValueCriterion(a: FromToValueCriterion, b: ValueCriterion): FromToValueCriterion | null {
    switch (b.op) {
        case "from-to":
            if (a.from !== void 0 && a.to !== void 0) {
                const fromInside = isFromInsideFromTo(a.from, b);
                const toInside = isToInsideFromTo(a.to, b);

                if (fromInside && toInside) {
                    return null;
                } else if (fromInside) {
                    if (b.to === void 0) {
                        // this code path should never be hit because if b.to === void 0, and fromInside is true, then toInside has to be true as well.
                    } else {
                        if (b.to.op === "<=") {
                            return { op: "from-to", from: { op: ">", value: b.to.value }, to: { op: a.to.op, value: a.to.value } };
                        } else {
                            return { op: "from-to", from: { op: ">=", value: b.to.value }, to: { op: a.to.op, value: a.to.value } };
                        }
                    }
                } else if (toInside) {
                    if (b.from === void 0) {
                        // this code path should never be hit because if b.from === void 0, and toInside is true, then fromInside has to be true as well.
                    } else {
                        if (b.from.op === ">=") {
                            return { op: "from-to", from: { op: a.from.op, value: a.from.value }, to: { op: "<", value: b.from.value } };
                        } else {
                            return { op: "from-to", from: { op: a.from.op, value: a.from.value }, to: { op: "<=", value: b.from.value } };
                        }
                    }
                }
            } else if (a.from !== void 0) {
                if (isFromInsideFromTo(a.from, b)) {
                    if (b.to === void 0) {
                        return null;
                    } else {
                        if (b.to.op === "<=") {
                            return { op: "from-to", from: { op: ">", value: b.to.value } };
                        } else {
                            return { op: "from-to", from: { op: ">=", value: b.to.value } };
                        }
                    }
                }
            } else if (a.to !== void 0) {
                if (isToInsideFromTo(a.to, b)) {
                    if (b.from === void 0) {
                        return null;
                    } else {
                        if (b.from.op === ">=") {
                            return { op: "from-to", to: { op: "<", value: b.from.value } };
                        } else {
                            return { op: "from-to", to: { op: "<=", value: b.from.value } };
                        }
                    }
                }
            } else {
                // [todo] ???
            }
            break;

        case "in":
            const reduced: FromToValueCriterion = {
                ...a,
            };

            let didReduce = false;

            if (a.from?.op === ">=" && b.values.has(a.from.value)) {
                reduced.from = { op: ">", value: a.from.value };
                didReduce = true;
            }

            if (a.to?.op === "<=" && b.values.has(a.to.value)) {
                reduced.to = { op: "<", value: a.to.value };
                didReduce = true;
            }

            if (didReduce) {
                return reduced;
            }
            break;

        case "not-in":
            break;
    }

    return a;
}

import { ValueCriterion } from "../value-criterion";
import { InRangeCriterion } from "./in-range-criterion";
import { FromCriterion } from "./from-criterion";
import { ToCriterion } from "./to-criterion";
import { ValueCriteria } from "../value-criteria";

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

export function isFromInsideFromTo(a: FromCriterion, b: InRangeCriterion): boolean {
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

export function isToInsideFromTo(a: ToCriterion, b: InRangeCriterion): boolean {
    return isToBiggerThanFrom(a, b.from) && isToSmallerThanTo(a, b.to);
}

export function reduceInRange(a: InRangeCriterion, b: ValueCriterion): ValueCriteria | false {
    switch (b.op) {
        // [todo] revisit & try to simplify this from-to / from-to reduction.
        case "from-to":
            if (a.from !== void 0 && a.to !== void 0) {
                const fromInside = isFromInsideFromTo(a.from, b);
                const toInside = isToInsideFromTo(a.to, b);

                if (fromInside && toInside) {
                    return [];
                } else if (fromInside) {
                    if (b.to === void 0) {
                        // this code path should never be hit because if b.to === void 0, and fromInside is true, then toInside has to be true as well.
                    } else {
                        if (b.to.op === "<=") {
                            return [{ op: "from-to", from: { op: ">", value: b.to.value }, to: { op: a.to.op, value: a.to.value } }];
                        } else {
                            return [{ op: "from-to", from: { op: ">=", value: b.to.value }, to: { op: a.to.op, value: a.to.value } }];
                        }
                    }
                } else if (toInside) {
                    if (b.from === void 0) {
                        // this code path should never be hit because if b.from === void 0, and toInside is true, then fromInside has to be true as well.
                    } else {
                        if (b.from.op === ">=") {
                            return [{ op: "from-to", from: { op: a.from.op, value: a.from.value }, to: { op: "<", value: b.from.value } }];
                        } else {
                            return [{ op: "from-to", from: { op: a.from.op, value: a.from.value }, to: { op: "<=", value: b.from.value } }];
                        }
                    }
                } else if (b.from !== void 0 && b.to !== void 0) {
                    const fromInside = isFromInsideFromTo(b.from, a);
                    const toInside = isToInsideFromTo(b.to, a);

                    if (fromInside && toInside) {
                        const result: ValueCriterion[] = [];

                        if (b.from.op === ">") {
                            result.push({ op: "from-to", from: { ...a.from }, to: { op: "<=", value: b.from.value } });
                        } else {
                            result.push({ op: "from-to", from: { ...a.from }, to: { op: "<", value: b.from.value } });
                        }

                        if (b.to.op === "<") {
                            result.push({ op: "from-to", from: { op: ">=", value: b.to.value }, to: { ...a.to } });
                        } else {
                            result.push({ op: "from-to", from: { op: ">", value: b.to.value }, to: { ...a.to } });
                        }

                        return result;
                    }
                }
            } else if (a.from !== void 0) {
                if (isFromInsideFromTo(a.from, b)) {
                    if (b.to === void 0) {
                        return [];
                    } else {
                        if (b.to.op === "<=") {
                            return [{ op: "from-to", from: { op: ">", value: b.to.value } }];
                        } else {
                            return [{ op: "from-to", from: { op: ">=", value: b.to.value } }];
                        }
                    }
                } else if (b.from !== void 0 && b.to !== void 0) {
                    const fromInside = isFromInsideFromTo(b.from, a);
                    const toInside = isToInsideFromTo(b.to, a);

                    if (fromInside && toInside) {
                        const result: ValueCriterion[] = [];

                        if (b.from.op === ">") {
                            result.push({ op: "from-to", from: { ...a.from }, to: { op: "<=", value: b.from.value } });
                        } else {
                            result.push({ op: "from-to", from: { ...a.from }, to: { op: "<", value: b.from.value } });
                        }

                        if (b.to.op === "<") {
                            result.push({ op: "from-to", from: { op: ">=", value: b.to.value } });
                        } else {
                            result.push({ op: "from-to", from: { op: ">", value: b.to.value } });
                        }

                        return result;
                    }
                }
            } else if (a.to !== void 0) {
                if (isToInsideFromTo(a.to, b)) {
                    if (b.from === void 0) {
                        return [];
                    } else {
                        if (b.from.op === ">=") {
                            return [{ op: "from-to", to: { op: "<", value: b.from.value } }];
                        } else {
                            return [{ op: "from-to", to: { op: "<=", value: b.from.value } }];
                        }
                    }
                } else if (b.from !== void 0 && b.to !== void 0) {
                    const fromInside = isFromInsideFromTo(b.from, a);
                    const toInside = isToInsideFromTo(b.to, a);

                    if (fromInside && toInside) {
                        const result: ValueCriterion[] = [];

                        if (b.from.op === ">") {
                            result.push({ op: "from-to", to: { op: "<=", value: b.from.value } });
                        } else {
                            result.push({ op: "from-to", to: { op: "<", value: b.from.value } });
                        }

                        if (b.to.op === "<") {
                            result.push({ op: "from-to", from: { op: ">=", value: b.to.value }, to: { ...a.to } });
                        } else {
                            result.push({ op: "from-to", from: { op: ">", value: b.to.value }, to: { ...a.to } });
                        }

                        return result;
                    }
                }
            } else {
                // [todo] ???
            }
            break;

        case "in":
            const reduced: InRangeCriterion = {
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
                return [reduced];
            }
            break;

        case "not-in":
            // [todo] implement
            break;
    }

    return false;
}

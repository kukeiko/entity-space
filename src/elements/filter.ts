// todo: set criteria implementations missing
// todo: consider storing Date.getTime() instead of Date - would clean up and eliminate some "instanceof Date" checks
import { StringIndexable } from "../util";
import { AnyEntityMetadata } from "../metadata";

// todo: before switching out all inline strings with constants,
// check if it actually helps reduce the frequency / impact of GC calls
// (and not just in chrome)
const FROM_TO = "from-to";

let unexpectedRootLevelOp = (criterion: Filter.Criterion) =>
    new Error(`Filter.reduce() implementation missing: ${criterion.op} (${JSON.stringify(criterion)})`);

let unexpectedValueType = (value: any) =>
    new Error(`unexpected value type: ${typeof (value)}`);

let safeGetTime = (date: Date | null, fallback: number = null) => date ? date.getTime() : fallback;

type ReduceResult = Filter.Criterion | null;
type Reducer = (a: Filter.Criterion, b: Filter.Criterion) => Filter.Criterion | null;
type Reducers = Map<Filter.Types, Reducer>;

// todo: a lot of ops missing
// todo: use strict comparions === && !==
// todo: can return criterions with empty sets (in / common)
let reducers = new Map<Filter.Operations, Reducers>([
    // note: seems complete
    ["==", new Map<Filter.Types, Reducer>([
        ["bool", (a: Filter.BooleanEqualityCriterion, b: Filter.BooleanCriterion): ReduceResult => {
            switch (b.op) {
                case "==": return a.value == b.value ? null : b;
                case "!=": return a.value != b.value ? { op: "==", type: "bool", value: [true, false, null].filter(x => x != b.value && x != a.value)[0] } : b;
                case "in":
                    if (b.values.has(a.value)) {
                        if (b.values.size == 1) return null;

                        let copy = new Set(b.values);
                        copy.delete(a.value);

                        return copy.size == 1
                            ? { op: "==", type: "bool", value: copy.values().next().value }
                            : { op: b.op, type: "bool", values: copy };
                    } else {
                        return b;
                    }

                case "not-in":
                    if (!b.values.has(a.value)) {
                        if (b.values.size == 2) return null;

                        return { op: "==", type: "bool", value: [true, false, null].filter(x => a.value !== x && !b.values.has(x))[0] };
                    } else {
                        return b;
                    }

                default: return b;
            }
        }],
        ["number", (a: Filter.NumberEqualityCriterion, b: Filter.NumberCriterion): ReduceResult => {
            if (a.value == null && Filter.isPointCriterion(b)) return b;

            switch (b.op) {
                case "==": return a.value == b.value ? null : b;
                case "!=": return b;
                case "<": return a.value + b.step == b.value ? { op: "<", type: "number", value: a.value, step: b.step } : b;
                case "<=": return a.value == b.value ? { op: "<", type: "number", value: a.value, step: b.step } : b;
                case ">": return a.value - b.step == b.value ? { op: ">", type: "number", value: a.value, step: b.step } : b;
                case ">=": return a.value == b.value ? { op: ">", type: "number", value: a.value, step: b.step } : b;
                case "in":
                    if (b.values.has(a.value)) {
                        if (b.values.size == 1) return null;

                        let copy = new Set(b.values);
                        copy.delete(a.value);

                        return copy.size == 1
                            ? { op: "==", type: "number", value: copy.values().next().value }
                            : { op: b.op, type: "number", values: copy };
                    } else {
                        return b;
                    }

                case "not-in":
                    if (!b.values.has(a.value)) {
                        let copy = new Set(b.values);
                        copy.add(a.value);

                        return { op: "not-in", type: "number", values: copy };
                    } else {
                        return b;
                    }

                case "from-to":
                    if (a.value == b.range[0]) {
                        return { op: "from-to", type: "number", range: [a.value + b.step, b.range[1]], step: b.step };
                    } else if (a.value == b.range[1]) {
                        return { op: "from-to", type: "number", range: [b.range[0], a.value - b.step], step: b.step };
                    } else {
                        return b;
                    }

                default: return b;
            }
        }],
        ["string", (a: Filter.StringEqualityCriterion, b: Filter.StringCriterion): ReduceResult => {
            if (a.value == null && Filter.isPointCriterion(b)) return b;

            switch (b.op) {
                case "==": return a.value == b.value ? null : b;
                case "<=": return a.value == b.value ? { op: "<", type: "string", value: a.value } : b;
                case ">=": return a.value == b.value ? { op: ">", type: "string", value: a.value } : b;
                case "in":
                    if (b.values.has(a.value)) {
                        if (b.values.size == 1) return null;

                        let copy = new Set(b.values);
                        copy.delete(a.value);

                        return copy.size == 1
                            ? { op: "==", type: "string", value: copy.values().next().value }
                            : { op: b.op, type: "string", values: copy };
                    } else {
                        return b;
                    }

                case "not-in":
                    if (!b.values.has(a.value)) {
                        let copy = new Set(b.values);
                        copy.add(a.value);

                        return { op: "not-in", type: "string", values: copy };
                    } else {
                        return b;
                    }

                default: return b;
            }
        }],
        ["guid", (a: Filter.GuidEqualityCriterion, b: Filter.GuidCriterion): ReduceResult => {
            switch (b.op) {
                case "==": return a.value == b.value ? null : b;
                case "in":
                    if (b.values.has(a.value)) {
                        if (b.values.size == 1) return null;

                        let copy = new Set(b.values);
                        copy.delete(a.value);

                        return copy.size == 1
                            ? { op: "==", type: "guid", value: copy.values().next().value }
                            : { op: b.op, type: "guid", values: copy };
                    } else {
                        return b;
                    }

                case "not-in":
                    if (!b.values.has(a.value)) {
                        let copy = new Set(b.values);
                        copy.add(a.value);

                        return { op: "not-in", type: "guid", values: copy };
                    } else {
                        return b;
                    }

                default: return b;
            }
        }],
        ["date", (a: Filter.DateEqualityCriterion, b: Filter.DateCriterion): ReduceResult => {
            if (a.value == null && b.op != "==" && b.op != "!=") return b;

            switch (b.op) {
                case "==": return safeGetTime(a.value) == safeGetTime(b.value) ? null : b;
                case "<=": return +a.value == +b.value ? { op: "<", type: "date", value: a.value } : b;
                case ">=": return +a.value == +b.value ? { op: ">", type: "date", value: a.value } : b;
                case "!=": case "<": case ">": case "from-to": return b;
                default: return b;
            }
        }]
    ])],
    // note: seems complete
    ["!=", new Map<Filter.Types, Reducer>([
        ["bool", (a: Filter.BooleanEqualityCriterion, b: Filter.BooleanCriterion): ReduceResult => {
            switch (b.op) {
                case "==": return a.value == b.value ? b : null;
                case "!=": return a.value == b.value ? null : { op: "==", type: "bool", value: a.value };
                case "in": return b.values.has(a.value) ? { op: "==", type: "bool", value: a.value } : null;
                case "not-in": return !b.values.has(a.value) ? { op: "==", type: "bool", value: a.value } : null;
                default: return b;
            }
        }],
        ["number", (a: Filter.NumberEqualityCriterion, b: Filter.NumberCriterion): ReduceResult => {
            if (a.value == null && b.op != "==" && b.op != "!=" && b.op != "in" && b.op != "common") return b;

            switch (b.op) {
                case "==": return a.value == b.value ? b : null;
                case "!=": return a.value == b.value ? null : b;
                case "<": return a.value < b.value ? { op: "==", type: "number", value: a.value } : null;
                case "<=": return a.value <= b.value ? { op: "==", type: "number", value: a.value } : null;
                case ">": return a.value > b.value ? { op: "==", type: "number", value: a.value } : null;
                case ">=": return a.value >= b.value ? { op: "==", type: "number", value: a.value } : null;
                case "in": return b.values.has(a.value) ? { op: "==", type: "number", value: a.value } : null;
                case "not-in": return !b.values.has(a.value) ? { op: "==", type: "number", value: a.value } : null;
                case "from-to": return a.value >= b.range[0] && a.value <= b.range[1] ? { op: "==", type: "number", value: a.value } : null;
                default: return b;
            }
        }],
        ["string", (a: Filter.StringEqualityCriterion, b: Filter.StringCriterion): ReduceResult => {
            switch (b.op) {
                case "==": return a.value == b.value ? b : null;
                case "!=": return a.value == b.value ? null : b;
                case "<": return a.value < b.value ? { op: "==", type: "string", value: a.value } : null;
                case "<=": return a.value <= b.value ? { op: "==", type: "string", value: a.value } : null;
                case ">": return a.value > b.value ? { op: "==", type: "string", value: a.value } : null;
                case ">=": return a.value >= b.value ? { op: "==", type: "string", value: a.value } : null;
                case "in": return b.values.has(a.value) ? { op: "==", type: "string", value: a.value } : null;
                case "not-in": return !b.values.has(a.value) ? { op: "==", type: "string", value: a.value } : null;
                case "from-to": return a.value >= b.range[0] && a.value <= b.range[1] ? { op: "==", type: "string", value: a.value } : null;
                default: return b;
            }
        }],
        ["guid", (a: Filter.GuidEqualityCriterion, b: Filter.GuidCriterion): ReduceResult => {
            switch (b.op) {
                case "==": return a.value == b.value ? b : null;
                case "!=": return a.value == b.value ? null : b;
                case "in": return b.values.has(a.value) ? { op: "==", type: "guid", value: a.value } : null;
                case "not-in": return !b.values.has(a.value) ? { op: "==", type: "guid", value: a.value } : null;
                default: return b;
            }
        }],
        ["date", (a: Filter.DateEqualityCriterion, b: Filter.DateCriterion): ReduceResult => {
            if (a.value == null && b.op != "==" && b.op != "!=") return b;

            switch (b.op) {
                case "==": return safeGetTime(a.value) == safeGetTime(b.value) ? b : null;
                case "!=": return safeGetTime(a.value) == safeGetTime(b.value) ? null : b;
                case "<": return a.value < b.value ? { op: "==", type: "date", value: a.value } : null;
                case "<=": return a.value <= b.value ? { op: "==", type: "date", value: a.value } : null;
                case ">": return a.value > b.value ? { op: "==", type: "date", value: a.value } : null;
                case ">=": return a.value >= b.value ? { op: "==", type: "date", value: a.value } : null;
                case "from-to": return a.value >= b.range[0] && a.value <= b.range[1] ? { op: "==", type: "date", value: a.value } : null;
                default: return b;
            }
        }]
    ])],
    // note: not yet checked if complete
    ["in", new Map<Filter.Types, Reducer>([
        ["bool", (a: Filter.BooleanMemberCriterion, b: Filter.BooleanCriterion): ReduceResult => {
            switch (b.op) {
                case "==": return a.values.has(b.value) ? null : b;
                case "in": {
                    let copy = new Set(b.values);
                    a.values.forEach(v => copy.delete(v));

                    return copy.size == 0 ? null : { op: b.op, type: "bool", values: copy };
                }

                case "not-in": {
                    let copy = new Set(b.values);
                    a.values.forEach(v => copy.add(v));

                    return copy.size == 3 ? null : { op: b.op, type: "bool", values: copy };
                }

                default: return b;
            }
        }],
        ["number", (a: Filter.NumberMemberCriterion, b: Filter.NumberCriterion): ReduceResult => {
            switch (b.op) {
                case "==": return a.values.has(b.value) ? null : b;
                case "in": {
                    let copy = new Set(b.values);
                    a.values.forEach(v => copy.delete(v));

                    return copy.size == 0 ? null : { op: b.op, type: "number", values: copy };
                }

                case "not-in": {
                    let copy = new Set(b.values);
                    a.values.forEach(v => copy.add(v));

                    return { op: b.op, type: "number", values: copy };
                }

                default: return b;
            }
        }],
        ["string", (a: Filter.StringMemberCriterion, b: Filter.StringCriterion): ReduceResult => {
            switch (b.op) {
                case "==": return a.values.has(b.value) ? null : b;
                case "in": {
                    let copy = new Set(b.values);
                    a.values.forEach(v => copy.delete(v));

                    return copy.size == 0 ? null : { op: b.op, type: "string", values: copy };
                }

                case "not-in": {
                    let copy = new Set(b.values);
                    a.values.forEach(v => copy.add(v));

                    return { op: b.op, type: "string", values: copy };
                }

                default: return b;
            }
        }],
        ["guid", (a: Filter.GuidMemberCriterion, b: Filter.GuidCriterion): ReduceResult => {
            switch (b.op) {
                case "==": return a.values.has(b.value) ? null : b;
                case "in": {
                    let copy = new Set(b.values);
                    a.values.forEach(v => copy.delete(v));

                    return copy.size == 0 ? null : { op: b.op, type: "guid", values: copy };
                }

                case "not-in": {
                    let copy = new Set(b.values);
                    a.values.forEach(v => copy.add(v));

                    return { op: b.op, type: "guid", values: copy };
                }

                default: return b;
            }
        }]
    ])],
    // todo: incomplete
    ["<", new Map<Filter.Types, Reducer>([
        // note: seems complete
        ["number", (a: Filter.NumberPointCriterion, b: Filter.NumberCriterion): ReduceResult => {
            switch (b.op) {
                case "==": return b.value < a.value ? null : b;
                case "!=": return { op: ">=", type: "number", value: a.value, step: a.step };
                case "<": return b.value <= a.value ? null
                    : (a.value + b.step) == b.value
                        ? { op: "==", type: "number", value: a.value }
                        : { op: FROM_TO, type: "number", range: [a.value, b.value - b.step], step: b.step };

                case "<=": return b.value < a.value ? null
                    : a.value == b.value
                        ? { op: "==", type: "number", value: a.value }
                        : { op: FROM_TO, type: "number", range: [a.value, b.value], step: b.step };

                case ">": return b.value + b.step < a.value ? { op: ">=", type: "number", value: a.value, step: b.step } : b;
                case ">=": return b.value < a.value ? { op: ">=", type: "number", value: a.value, step: b.step } : b;
                case "from-to": {
                    if (a.value > b.range[1]) return null;
                    if (a.value == b.range[1]) return { op: "==", type: "number", value: a.value };
                    if (a.value > b.range[0]) return { op: FROM_TO, type: "number", range: [a.value, b.range[1]], step: b.step };

                    return b;
                }

                case "in": {
                    let copy = new Set(b.values);
                    copy.forEach(v => v < a.value && copy.delete(v));

                    if (copy.size == b.values.size) return b;
                    if (copy.size == 0) return null;
                    if (copy.size == 1) return { op: "==", type: "number", value: copy.values().next().value };

                    return { op: "in", type: "number", values: copy };
                }

                default: return b;
            }
        }]
    ])],
    // todo: incomplete
    ["<=", new Map<Filter.Types, Reducer>([
        // note: seems complete
        ["number", (a: Filter.NumberPointCriterion, b: Filter.NumberCriterion): ReduceResult => {
            switch (b.op) {
                case "==": return b.value <= a.value ? null : b;
                case "!=": return { op: ">", type: "number", value: a.value, step: a.step };
                case "<": return b.value <= a.value + b.step ? null
                    : (a.value + (b.step * 2)) == b.value
                        ? { op: "==", type: "number", value: a.value + b.step }
                        : { op: FROM_TO, type: "number", range: [a.value + b.step, b.value - b.step], step: b.step };

                case "<=": return b.value <= a.value ? null
                    : a.value + b.step == b.value
                        ? { op: "==", type: "number", value: b.value }
                        : { op: FROM_TO, type: "number", range: [a.value + b.step, b.value], step: b.step };

                case ">": return b.value < a.value ? { op: ">", type: "number", value: a.value, step: b.step } : b;
                case ">=": return b.value <= a.value ? { op: ">", type: "number", value: a.value, step: b.step } : b;
                case "from-to": {
                    if (a.value >= b.range[1]) return null;
                    if (a.value + b.step == b.range[1]) return { op: "==", type: "number", value: b.range[1] };
                    if (a.value >= b.range[0]) return { op: FROM_TO, type: "number", range: [a.value + b.step, b.range[1]], step: b.step };

                    return b;
                }

                case "in": {
                    let copy = new Set(b.values);
                    copy.forEach(v => v <= a.value && copy.delete(v));

                    if (copy.size == b.values.size) return b;
                    if (copy.size == 0) return null;
                    if (copy.size == 1) return { op: "==", type: "number", value: copy.values().next().value };

                    return { op: "in", type: "number", values: copy };
                }

                default: return b;
            }
        }]
    ])],
    // todo: incomplete
    [">", new Map<Filter.Types, Reducer>([
        // note: seems complete
        ["number", (a: Filter.NumberPointCriterion, b: Filter.NumberCriterion): ReduceResult => {
            switch (b.op) {
                case "==": return b.value > a.value ? null : b;
                case "!=": return { op: "<=", type: "number", value: a.value, step: a.step };
                case "<": return b.value > a.value ? { op: "<=", type: "number", value: a.value, step: b.step } : b;
                case "<=": return b.value >= a.value ? { op: "<=", type: "number", value: a.value, step: b.step } : b;
                case ">": return b.value >= a.value ? null
                    : (a.value - b.step) == b.value
                        ? { op: "==", type: "number", value: a.value }
                        : { op: FROM_TO, type: "number", range: [b.value + b.step, a.value], step: b.step };
                case ">=": return b.value > a.value ? null
                    : a.value == b.value
                        ? { op: "==", type: "number", value: a.value }
                        : { op: FROM_TO, type: "number", range: [b.value, a.value], step: b.step };

                case "from-to": {
                    if (a.value < b.range[0]) return null;
                    if (a.value == b.range[0]) return { op: "==", type: "number", value: a.value };
                    if (a.value < b.range[1]) return { op: FROM_TO, type: "number", range: [b.range[0], a.value], step: b.step };

                    return b;
                }

                case "in": {
                    let copy = new Set(b.values);
                    copy.forEach(v => v > a.value && copy.delete(v));

                    if (copy.size == b.values.size) return b;
                    if (copy.size == 0) return null;
                    if (copy.size == 1) return { op: "==", type: "number", value: copy.values().next().value };

                    return { op: "in", type: "number", values: copy };
                }

                default: return b;
            }
        }]
    ])],
    // todo: incomplete
    [">=", new Map<Filter.Types, Reducer>([
        // note: seems complete
        ["number", (a: Filter.NumberPointCriterion, b: Filter.NumberCriterion): ReduceResult => {
            switch (b.op) {
                case "==": return b.value >= a.value ? null : b;
                case "!=": return { op: "<", type: "number", value: a.value, step: a.step };
                case "<": return b.value > a.value ? { op: "<", type: "number", value: a.value, step: b.step } : b;
                case "<=": return b.value >= a.value ? { op: "<", type: "number", value: a.value, step: b.step } : b;
                case ">": return a.value - b.step <= b.value ? null
                    : (a.value - (b.step * 2)) == b.value
                        ? { op: "==", type: "number", value: a.value - b.step }
                        : { op: FROM_TO, type: "number", range: [b.value + b.step, a.value - b.step], step: b.step };

                case ">=": return a.value <= b.value ? null
                    : a.value - b.step == b.value
                        ? { op: "==", type: "number", value: b.value }
                        : { op: FROM_TO, type: "number", range: [b.value, a.value - b.step], step: b.step };


                case "from-to": {
                    if (a.value <= b.range[0]) return null;
                    if (a.value - b.step == b.range[0]) return { op: "==", type: "number", value: b.range[0] };
                    if (a.value <= b.range[1]) return { op: FROM_TO, type: "number", range: [b.range[0], a.value - b.step], step: b.step };

                    return b;
                }

                case "in": {
                    let copy = new Set(b.values);
                    copy.forEach(v => v >= a.value && copy.delete(v));

                    if (copy.size == b.values.size) return b;
                    if (copy.size == 0) return null;
                    if (copy.size == 1) return { op: "==", type: "number", value: copy.values().next().value };

                    return { op: "in", type: "number", values: copy };
                }

                default: return b;
            }
        }]
    ])],
    // todo: incomplete
    ["from-to", new Map<Filter.Types, Reducer>([
        ["number", (a: Filter.NumberRangeCriterion, b: Filter.NumberCriterion): ReduceResult => {
            let [minA, maxA] = a.range;

            switch (b.op) {
                case "==": return b.value >= minA && b.value <= maxA ? null : b;
                case "!=": return b;
                case "<=": return b.value >= minA && b.value <= maxA ? { op: "<", type: "number", value: minA, step: b.step } : b;
                case "<": return b.value > minA && b.value <= (maxA + b.step) ? { op: "<", type: "number", value: minA, step: b.step } : b;
                case ">=": return b.value >= minA && b.value <= maxA ? { op: ">=", type: "number", value: maxA + b.step, step: b.step } : b;
                case ">": return b.value >= (minA - b.step) && b.value < maxA ? { op: ">", type: "number", value: maxA, step: b.step } : b;

                case "in":
                    let copy = new Set(b.values);
                    b.values.forEach(v => (v >= minA && v <= maxA) && copy.delete(v));

                    return copy.size == 0 ? null : { op: b.op, type: "number", values: copy };

                case "not-in": return b;

                case "from-to":
                    let [minB, maxB] = b.range;
                    let minInside = minB <= maxA && minB >= minA;
                    let maxInside = maxB <= maxA && maxB >= minA;

                    if (minInside && maxInside) {
                        return null;
                    } else if (minInside) {
                        return { op: "from-to", type: "number", range: [minB + (maxA - minB), maxB], step: b.step };
                    } else if (maxInside) {
                        return { op: "from-to", type: "number", range: [minB, maxB - (maxB - minA)], step: b.step };
                    } else {
                        return b;
                    }

                default: return b;
            }
        }],
        ["string", (a: Filter.StringRangeCriterion, b: Filter.StringCriterion): ReduceResult => {
            let [minA, maxA] = a.range;

            switch (b.op) {
                case "==": return b.value >= minA && b.value <= maxA ? null : b;
                case "!=": return b;
                case "<": case "<=": return b.value >= minA && b.value <= maxA ? { op: "<", type: "string", value: minA } : b;
                case ">": case ">=": return b.value >= minA && b.value <= maxA ? { op: ">", type: "string", value: maxA } : b;

                case "in":
                    let copy = new Set(b.values);
                    b.values.forEach(v => (v >= minA && v <= maxA) && copy.delete(v));

                    return copy.size == 0 ? null : { op: b.op, type: "string", values: copy };

                case "not-in": return b;

                case "from-to":
                    let [minB, maxB] = b.range;
                    let minInside = minB <= maxA && minB >= minA;
                    let maxInside = maxB <= maxA && maxB >= minA;

                    if (minInside && maxInside) {
                        return null;
                    } else if (minInside) {
                        return { op: "from-to", type: "string", range: [maxA, maxB] };
                    } else if (maxInside) {
                        return { op: "from-to", type: "string", range: [minB, minA] };
                    } else {
                        return b;
                    }

                default: return b;
            }
        }],
        ["date", (a: Filter.DateRangeCriterion, b: Filter.DateCriterion): ReduceResult => {
            let [minA, maxA] = a.range;

            switch (b.op) {
                case "==": return b.value >= minA && b.value <= maxA ? null : b;
                case "!=": return b;
                // todo: use steps (after implementing to use Date.getTime() instead of Date)
                case "<": case "<=": return b.value >= minA && b.value <= maxA ? { op: "<", type: "date", value: minA } : b;
                case ">": case ">=": return b.value >= minA && b.value <= maxA ? { op: ">", type: "date", value: maxA } : b;

                case "from-to":
                    let [minB, maxB] = b.range;
                    let minInside = minB <= maxA && minB >= minA;
                    let maxInside = maxB <= maxA && maxB >= minA;

                    if (minInside && maxInside) {
                        return null;
                    } else if (minInside) {
                        return { op: "from-to", type: "date", range: [maxA, maxB] };
                    } else if (maxInside) {
                        return { op: "from-to", type: "date", range: [minB, minA] };
                    } else {
                        return b;
                    }

                default: return b;
            }
        }]
    ])]
]);

/**
 * Describes criteria entities processed by a query must adhere to.
 *
 * Immutable
 */
export class Filter {
    readonly criteria: Filter.Criteria;
    readonly length: number;

    constructor(criteria: Filter.Criteria) {
        this.criteria = Object.freeze(criteria);
        this.length = Object.keys(criteria).length;

        Object.freeze(this);
    }

    /**
     * Reduces another filter by reducing common (i.e. pointing to the same property) criteria.
     *
     * Returns null if the given filter is completely reduced, otherwise a new filter where one criteria has been partially reduced.
     *
     * Throws if the filters have a common criteria with incompatible value types.
     */
    reduce(other: Filter): Filter | null {
        if (this.length > other.length) return other;
        for (let k in this.criteria) if (other.criteria[k] == null) return other;

        let reduced: [string, Filter.Criterion] = null;

        for (let k in this.criteria) {
            let a = this.criteria[k];
            let b = other.criteria[k];

            if (a.type != b.type) {
                throw new Error(`trying to reduce criteria of incompatible types: ${a.type} and ${b.type}`);
            }

            if (!reducers.has(a.op)) {
                throw unexpectedRootLevelOp(a);
            }

            let criterion = reducers.get(a.op).get(b.type)(a, b);

            if (criterion != null) {
                if (reduced != null || criterion == b) {
                    return other;
                }

                reduced = [k, criterion];
            }
        }

        if (reduced == null) return null;

        let newCriteria = Object.assign({}, other.criteria);
        newCriteria[reduced[0]] = reduced[1];

        return new Filter(newCriteria);
    }

    filter<T extends StringIndexable>(items: T[]): T[] {
        let matches: T[] = [];
        let length = items.length;

        for (let i = 0; i < length; ++i) {
            this._itemMatches(items[i]) && matches.push(items[i]);
        }

        return matches;
    }

    // todo: maybe rework, is a bit wonky due to "is value null" check
    // todo: casts to Set<any> are meh
    private _itemMatches(item: StringIndexable): boolean {
        let c: Filter.Criterion;
        let v: any;

        for (let k in this.criteria) {
            c = this.criteria[k];
            v = item[k];

            if (v == null) {
                if (c.op == "==") {
                    if (c.value != null) return false;
                } else if (c.op == "!=") {
                    if (c.value == null) return false;
                } else if (c.op == "in") {
                    return (c.values as Set<any>).has(v);
                } else if (c.op == "not-in") {
                    return !(c.values as Set<any>).has(v);
                } else {
                    // todo: set & member criteria implementation missing
                    return false;
                }
            } else if (Filter.isRangeCriterion(c)) {
                if (v < c.range[0] || v > c.range[1]) {
                    return false;
                }
            } else if (Filter.isSetCriterion(c)) {
                // todo: cast is meh
                let set = c.values as Set<any>;
                let array = v as any[];

                if (c.op == "common") {
                    let matched = false;

                    for (let e = 0; e < array.length; ++e) {
                        if (set.has(array[e])) {
                            matched = true;
                            break;
                        }
                    }

                    if (!matched) return false;
                }
                // todo: future implementation - does not exist as of writing this
                // else if (c.op == "subset") {
                //     for (let e = 0; e < array.length; ++e) {
                //         if (!set.has(v[e])) return false;
                //     }
                // }

                // if (v instanceof Array) {

                // } else if (!set.has(v)) {
                //     return false;
                // }
            } else {
                switch (c.op) {
                    case "==":
                        if (c.type == "date") {
                            if ((v as Date).getTime() != c.value.getTime()) {
                                return false;
                            }
                        } else if (v != c.value) {
                            return false;
                        }
                        break;

                    case "!=":
                        if (c.type == "date") {
                            if ((v as Date).getTime() == c.value.getTime()) {
                                return false;
                            }
                        } else if (v == c.value) {
                            return false;
                        }
                        break;

                    case "<": if (v >= c.value) { return false; } break;
                    case "<=": if (v > c.value) { return false; } break;
                    case ">": if (v <= c.value) { return false; } break;
                    case ">=": if (v < c.value) { return false; } break;
                    case "in": return (c.values as Set<any>).has(v);
                    case "not-in": return !(c.values as Set<any>).has(v);
                }
            }
        }

        return true;
    }

    toDtoFormat(metadata: AnyEntityMetadata): Filter {
        let criteria: Filter.Criteria = {};

        for (let k in this.criteria) {
            criteria[metadata.getProperty(k).dtoName] = this.criteria[k];
        }

        return new Filter(criteria);
    }

    toEntityFormat(metadata: AnyEntityMetadata): Filter {
        let criteria: Filter.Criteria = {};

        for (let k in this.criteria) {
            criteria[metadata.getProperty(k).name] = this.criteria[k];
        }

        return new Filter(criteria);
    }
}

export module Filter {
    export interface BooleanEqualityCriterion { op: "==" | "!="; type: "bool"; value: boolean | null; }
    export interface NumberEqualityCriterion { op: "==" | "!="; type: "number"; value: number | null; }
    export interface StringEqualityCriterion { op: "==" | "!="; type: "string"; value: string | null; }
    export interface GuidEqualityCriterion { op: "==" | "!="; type: "guid"; value: string | null; }
    export interface DateEqualityCriterion { op: "==" | "!="; type: "date"; value: Date | null; }
    export type EqualityCriterion = BooleanEqualityCriterion | NumberEqualityCriterion | StringEqualityCriterion | GuidEqualityCriterion | DateEqualityCriterion;

    export interface BooleanMemberCriterion { op: "in" | "not-in"; type: "bool"; values: Set<boolean | null>; }
    export interface NumberMemberCriterion { op: "in" | "not-in"; type: "number"; values: Set<number | null>; }
    export interface StringMemberCriterion { op: "in" | "not-in"; type: "string"; values: Set<string | null>; }
    export interface GuidMemberCriterion { op: "in" | "not-in"; type: "guid"; values: Set<string | null>; }
    export type MemberCriterion = BooleanMemberCriterion | NumberMemberCriterion | StringMemberCriterion | GuidMemberCriterion;

    export interface BooleanSetCriterion { op: "common"; type: "bool"; values: Set<boolean | null>; }
    export interface NumberSetCriterion { op: "common"; type: "number"; values: Set<number | null>; }
    export interface StringSetCriterion { op: "common"; type: "string"; values: Set<string | null>; }
    export interface GuidSetCriterion { op: "common"; type: "guid"; values: Set<string | null>; }
    export type SetCriterion = BooleanSetCriterion | NumberSetCriterion | StringSetCriterion | GuidSetCriterion;

    export interface NumberPointCriterion { op: "<" | "<=" | ">" | ">="; type: "number"; value: number; step: number; }
    export interface StringPointCriterion { op: "<" | "<=" | ">" | ">="; type: "string"; value: string; }
    export interface DatePointCriterion { op: "<" | "<=" | ">" | ">="; type: "date"; value: Date; }
    export type PointCriterion = NumberPointCriterion | StringPointCriterion | DatePointCriterion;

    export interface NumberRangeCriterion { op: "from-to"; type: "number"; range: [number, number]; step: number; }
    export interface StringRangeCriterion { op: "from-to"; type: "string"; range: [string, string]; }
    export interface DateRangeCriterion { op: "from-to"; type: "date"; range: [Date, Date]; }
    export type RangeCriterion = NumberRangeCriterion | StringRangeCriterion | DateRangeCriterion;

    export type SingleValueCriterion = EqualityCriterion | PointCriterion;

    export type Criterion = EqualityCriterion | PointCriterion | MemberCriterion | SetCriterion | RangeCriterion;
    export type Operations = Criterion["op"];
    export type SingleValueOperations = SingleValueCriterion["op"];
    export type Types = Criterion["type"];

    export type BooleanCriterion = BooleanEqualityCriterion | BooleanMemberCriterion | BooleanSetCriterion;
    export type NumberCriterion = NumberEqualityCriterion | NumberPointCriterion | NumberMemberCriterion | NumberSetCriterion | NumberRangeCriterion;
    export type StringCriterion = StringEqualityCriterion | StringPointCriterion | StringMemberCriterion | StringSetCriterion | StringRangeCriterion;
    export type GuidCriterion = GuidEqualityCriterion | GuidMemberCriterion | GuidSetCriterion;
    export type DateCriterion = DateEqualityCriterion | DatePointCriterion | DateRangeCriterion;

    export interface Criteria {
        [property: string]: Criterion;
    }

    export function isMemberCriterion(criterion: Criterion): criterion is MemberCriterion {
        return criterion.op == "in" || criterion.op == "not-in";
    }

    export function isSetCriterion(criterion: Criterion): criterion is SetCriterion {
        return criterion.op == "common";
    }

    export function isRangeCriterion(criterion: Criterion): criterion is RangeCriterion {
        return criterion.op == "from-to";
    }

    let pointOperations = new Set<Operations>(["<", "<=", ">", ">="]);

    export function isPointCriterion(criterion: Criterion): criterion is PointCriterion {
        return pointOperations.has(criterion.op);
    }

    export function isNull(type: Types): EqualityCriterion {
        return <EqualityCriterion>{ op: "==", type: type, value: null };
    }

    export function notNull(type: Types): EqualityCriterion {
        return <EqualityCriterion>{ op: "!=", type: type, value: null };
    }

    // todo: guid missing (not just for equals)
    export function equals(value: boolean): BooleanEqualityCriterion;
    export function equals(value: number): NumberEqualityCriterion;
    export function equals(value: string): StringEqualityCriterion;
    export function equals(value: Date): DateEqualityCriterion;
    export function equals(value: boolean | number | string | Date): EqualityCriterion {
        switch (typeof (value)) {
            case "boolean": return { op: "==", type: "bool", value: value as boolean };
            case "number": return { op: "==", type: "number", value: value as number };
            case "string": return { op: "==", type: "string", value: value as string };
            case "object": if (value instanceof Date) { return { op: "==", type: "date", value: value }; };
            default: throw unexpectedValueType(value);
        }
    }

    export function notEquals(value: boolean): BooleanEqualityCriterion;
    export function notEquals(value: number): NumberEqualityCriterion;
    export function notEquals(value: string): StringEqualityCriterion;
    export function notEquals(value: Date): DateEqualityCriterion;
    export function notEquals(value: boolean | number | string | Date): EqualityCriterion {
        switch (typeof (value)) {
            case "boolean": return { op: "!=", type: "bool", value: value as boolean };
            case "number": return { op: "!=", type: "number", value: value as number };
            case "string": return { op: "!=", type: "string", value: value as string };
            case "object": if (value instanceof Date) { return { op: "!=", type: "date", value: value }; };
            default: throw unexpectedValueType(value);
        }
    }

    export function less(value: number, step?: number): NumberPointCriterion;
    export function less(value: string): StringPointCriterion;
    export function less(value: Date): DatePointCriterion;
    export function less(value: number | string | Date, step?: number): PointCriterion {
        switch (typeof (value)) {
            case "number": return { op: "<", type: "number", value: value as number, step: step || 1 };
            case "string": return { op: "<", type: "string", value: value as string };
            case "object": if (value instanceof Date) return { op: "<", type: "date", value: value };
            default: throw unexpectedValueType(value);
        }
    }

    export function lessEquals(value: number, step?: number): NumberPointCriterion;
    export function lessEquals(value: string): StringPointCriterion;
    export function lessEquals(value: Date): DatePointCriterion;
    export function lessEquals(value: number | string | Date, step?: number): PointCriterion {
        switch (typeof (value)) {
            case "number": return { op: "<=", type: "number", value: value as number, step: step || 1 };
            case "string": return { op: "<=", type: "string", value: value as string };
            case "object": if (value instanceof Date) return { op: "<=", type: "date", value: value };
            default: throw unexpectedValueType(value);
        }
    }

    export function greater(value: number, step?: number): NumberPointCriterion;
    export function greater(value: string): StringPointCriterion;
    export function greater(value: Date): DatePointCriterion;
    export function greater(value: number | string | Date, step?: number): PointCriterion {
        switch (typeof (value)) {
            case "number": return { op: ">", type: "number", value: value as number, step: step || 1 };
            case "string": return { op: ">", type: "string", value: value as string };
            case "object": if (value instanceof Date) return { op: ">", type: "date", value: value };
            default: throw unexpectedValueType(value);
        }
    }

    export function greaterEquals(value: number, step?: number): NumberPointCriterion;
    export function greaterEquals(value: string): StringPointCriterion;
    export function greaterEquals(value: Date): DatePointCriterion;
    export function greaterEquals(value: number | string | Date, step?: number): PointCriterion {
        switch (typeof (value)) {
            case "number": return { op: ">=", type: "number", value: value as number, step: step || 1 };
            case "string": return { op: ">=", type: "string", value: value as string };
            case "object": if (value instanceof Date) return { op: ">=", type: "date", value: value };
            default: throw unexpectedValueType(value);
        }
    }

    export function inRange(from: number, to: number, step?: number): NumberRangeCriterion;
    export function inRange(from: string, to: string): StringRangeCriterion;
    export function inRange(from: Date, to: Date): DateRangeCriterion;
    export function inRange(from: number | string | Date, to: number | string | Date, step?: number): RangeCriterion {
        switch (typeof (from)) {
            case "number": return { op: FROM_TO, type: "number", range: [from as number, to as number], step: step || 1 };
            case "string": return { op: FROM_TO, type: "string", range: [from as string, to as string] };
            case "object": if (from instanceof Date) return { op: FROM_TO, type: "date", range: [from as Date, to as Date] };
            default: throw unexpectedValueType(from);
        }
    }

    export function memberOf(values: Iterable<boolean>): BooleanMemberCriterion;
    export function memberOf(values: Iterable<number>): NumberMemberCriterion;
    export function memberOf(values: Iterable<string>): StringMemberCriterion;
    export function memberOf(values: Iterable<boolean | number | string>): MemberCriterion {
        let set = new Set(values);
        if (set.size == 0) throw new Error("no values provided");

        let sample = set.values().next().value;

        switch (typeof (sample)) {
            case "boolean": return { op: "in", type: "bool", values: set as Set<boolean> };
            case "number": return { op: "in", type: "number", values: set as Set<number> };
            case "string": return { op: "in", type: "string", values: set as Set<string> };
            default: throw unexpectedValueType(sample);
        }
    }

    export function notMemberOf(values: Iterable<boolean>): BooleanMemberCriterion;
    export function notMemberOf(values: Iterable<number>): NumberMemberCriterion;
    export function notMemberOf(values: Iterable<string>): StringMemberCriterion;
    export function notMemberOf(values: Iterable<boolean | number | string>): MemberCriterion {
        let set = new Set(values);
        if (set.size == 0) throw new Error("no values provided");

        let sample = set.values().next().value;

        switch (typeof (sample)) {
            case "boolean": return { op: "not-in", type: "bool", values: set as Set<boolean> };
            case "number": return { op: "not-in", type: "number", values: set as Set<number> };
            case "string": return { op: "not-in", type: "string", values: set as Set<string> };
            default: throw unexpectedValueType(sample);
        }
    }
}

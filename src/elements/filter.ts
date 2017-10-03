// todo: before switching out all inline strings with constants,
// check if it actually helps reduce the frequency / impact of GC calls
// (and not just in chrome)
const FROM_TO = "from-to";

let unexpectedOp = (criterion: Filter.Criterion) =>
    new Error(`unexpected filter criteria op: ${criterion.op} (${JSON.stringify(criterion)})`);

let unexpectedValueType = (value: any) =>
    new Error(`unexpected value type: ${typeof (value)}`);

type ReduceResult = Filter.Criterion | null;
type Reducer = (a: Filter.Criterion, b: Filter.Criterion) => Filter.Criterion | null;
type Reducers = Map<Filter.Types, Reducer>;

// todo: a lot of ops missing
let reducers = new Map<Filter.Operations, Reducers>([
    // todo: other data types are missing
    ["==", new Map<Filter.Types, Reducer>([
        ["bool", (a: Filter.BooleanEqualityCriterion, b: Filter.BooleanEqualityCriterion): ReduceResult => {
            switch (b.op) {
                case "==": return a.value == b.value ? null : b;
                case "!=": return a.value != b.value ? { op: "==", type: "bool", value: [true, false, null].filter(x => x != b.value && x != a.value)[0] } : b;
                default: throw unexpectedOp(b);
            }
        }],
        ["number", (a: Filter.NumberEqualityCriterion, b: Filter.NumberCriterion): ReduceResult => {
            switch (b.op) {
                case "==": return a.value == b.value ? null : b;
                case "!=": return b;
                case "<": return a.value + b.step == b.value ? { op: "<", type: "number", value: a.value, step: b.step } : b;
                case "<=": return a.value == b.value ? { op: "<", type: "number", value: a.value, step: b.step } : b;
                case ">": return a.value - b.step == b.value ? { op: ">", type: "number", value: a.value, step: b.step } : b;
                case ">=": return a.value == b.value ? { op: ">", type: "number", value: a.value, step: b.step } : b;
                case "in": case "common":
                    if (b.values.has(a.value)) {
                        let copy = new Set(b.values);
                        copy.delete(a.value);

                        return { op: "in", type: "number", values: copy };
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
                default: throw unexpectedOp(b);
            }
        }]
    ])],
    // todo: other data types are missing
    ["!=", new Map<Filter.Types, Reducer>([
        ["bool", (a: Filter.BooleanEqualityCriterion, b: Filter.BooleanEqualityCriterion): ReduceResult => {
            switch (b.op) {
                case "==": return a.value == b.value ? b : null;
                case "!=": return a.value == b.value ? null : { op: "==", type: "bool", value: a.value };
                default: throw unexpectedOp(b);
            }
        }]
    ])],
    // todo: incomplete
    ["<", new Map<Filter.Types, Reducer>([
        ["number", (a: Filter.NumberPointCriterion, b: Filter.NumberCriterion): ReduceResult => {
            switch (b.op) {
                // todo: maybe makes sense to test that it may also produce "=="
                case "<": return a.value >= b.value ? null
                    : (b.value - b.step) == a.value
                        ? { op: "==", type: "number", value: a.value, step: b.step }
                        : { op: FROM_TO, type: "number", range: [a.value, b.value - b.step], step: b.step };
                case "<=": return a.value > b.value ? null : b;
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
                case "common":
                    let copy = new Set(b.values);
                    b.values.forEach(v => (v >= minA && v <= maxA) && copy.delete(v));

                    if (copy.size == 0) return null;

                    return { op: b.op, type: "number", values: copy };

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

                default: throw unexpectedOp(b);
            }
        }]
    ])],
    ["in", new Map<Filter.Types, Reducer>([
        ["number", (a: Filter.NumberSetCriterion, b: Filter.NumberCriterion): ReduceResult => {
            switch (b.op) {
                case "==": return a.values.has(b.value) ? null : b;
                case "in":
                case "common":
                    let copy = new Set(b.values);
                    a.values.forEach(v => copy.delete(v));

                    return copy.size == 0 ? null : { op: b.op, type: "number", values: copy };

                default: return b;
            }
        }]
    ])]
]);


/**
 * Describes some criteria entities processed by a query should have.
 *
 * Immutable
 */
export class Filter {
    readonly criteria: Filter.Criteria;

    constructor(criteria: Filter.Criteria) {
        this.criteria = Object.freeze(criteria);
        Object.freeze(this);
    }

    /**
     * Reduces another filter by reducing common (i.e. pointing to the same property) criteria.
     *
     * Returns null if the given filter is completely reduced, otherwise a new filter
     * where criteria where either partially reduced or left alone.
     *
     * Throws if the filters share a criteria where the value types are incompatible.
     */
    reduce(other: Filter): Filter | null {
        let reduced: [string, Filter.Criterion] = null;

        // todo: first check if this filter is a superset based on existing criteria
        // this way we might be able to not even start reducing single criteria

        for (let k in this.criteria) {
            if (other.criteria[k] == null) return other;

            let a = this.criteria[k];
            let b = other.criteria[k];

            if (a.type != b.type) {
                throw new Error(`trying to reduce criteria of incompatible types: ${a.type} and ${b.type}`);
            }

            if (!reducers.has(a.op)) {
                throw unexpectedOp(a);
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

    // filter()
}

export module Filter {
    export interface BooleanEqualityCriterion { op: "==" | "!="; type: "bool"; value: boolean | null; }
    export interface NumberEqualityCriterion { op: "==" | "!="; type: "number"; value: number | null; }
    export interface StringEqualityCriterion { op: "==" | "!="; type: "string"; value: string | null; }
    export interface DateEqualityCriterion { op: "==" | "!="; type: "date"; value: Date | null; }
    export type EqualityCriterion = BooleanEqualityCriterion | NumberEqualityCriterion | StringEqualityCriterion | DateEqualityCriterion;

    export interface NumberPointCriterion { op: "<" | "<=" | ">" | ">="; type: "number"; value: number; step: number; }
    export interface StringPointCriterion { op: "<" | "<=" | ">" | ">="; type: "string"; value: string; }
    export interface DatePointCriterion { op: "<" | "<=" | ">" | ">="; type: "date"; value: Date; }
    export type PointCriterion = NumberPointCriterion | StringPointCriterion | DatePointCriterion;

    export interface NumberSetCriterion { op: "in" | "common"; type: "number"; values: Set<number>; }
    export interface StringSetCriterion { op: "in" | "common"; type: "string"; values: Set<string>; }
    export type SetCriterion = NumberSetCriterion | StringSetCriterion;

    export interface NumberRangeCriterion { op: "from-to"; type: "number"; range: [number, number]; step: number; }
    export interface StringRangeCriterion { op: "from-to"; type: "string"; range: [string, string]; }
    export interface DateRangeCriterion { op: "from-to"; type: "date"; range: [Date, Date]; }
    export type RangeCriterion = NumberRangeCriterion | StringRangeCriterion | DateRangeCriterion;

    export type Criterion = EqualityCriterion | PointCriterion | SetCriterion | RangeCriterion;
    export type Operations = Criterion["op"];
    export type Types = Criterion["type"];

    export type BooleanCriterion = BooleanEqualityCriterion; // for completeness' sake
    export type NumberCriterion = NumberEqualityCriterion | NumberPointCriterion | NumberSetCriterion | NumberRangeCriterion;
    export type StringCriterion = StringEqualityCriterion | StringPointCriterion | StringSetCriterion | StringRangeCriterion;
    export type DateCriterion = DateEqualityCriterion | DatePointCriterion | DateRangeCriterion;

    export interface Criteria {
        [property: string]: Criterion;
    }

    export function isNull(type: Types): EqualityCriterion {
        return <EqualityCriterion>{ op: "==", type: type, value: null };
    }

    export function notNull(type: Types): EqualityCriterion {
        return <EqualityCriterion>{ op: "!=", type: type, value: null };
    }

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
}

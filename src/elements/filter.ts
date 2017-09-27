let lookup = new Map<Filter.Operations, (a: Filter.Criterion, b: Filter.Criterion) => Filter.Criterion | null>();

lookup.set("==", (a: Filter.EqualityCriterion, b) => {
    switch (b.op) {
        case "==": return a.value == b.value ? null : b;
        case "<": return (a.value as number) + b.step == b.value ? { op: "<", value: (a.value as number), step: b.step } : b;
        case "<=": return a.value == b.value ? { op: "<", value: a.value, step: b.step } : b;
        case ">": return (a.value as number) - b.step == b.value ? { op: ">", value: (a.value as number), step: b.step } : b;
        case ">=": return a.value == b.value ? { op: ">", value: a.value, step: b.step } : b;
        case "in": case "common":
            if ((b.values as Set<any>).has(a.value)) {
                let copy = new Set((b.values as Set<any>));
                copy.delete(a.value);

                return { op: "in", values: copy };
            }
        default: return b;
    }
    // return b.op == "==" ?  : b;
});

lookup.set("!=", (a: Filter.EqualityCriterion, b) => {
    return b.op == "!=" ? a.value == b.value ? null : b : b;
});

lookup.set("<", (a: Filter.PointCriterion, b) => {
    switch (b.op) {
        case "<": return a.value >= b.value ? null : { op: "from-to", range: [b.value, a.value], step: b.step };
        case "<=": return a.value > b.value ? null : b;
        default: return b;
    }
});

lookup.set("from-to", (a: Filter.RangeCriterion, b) => {
    let [minA, maxA] = a.range;

    switch (b.op) {
        case "==": return b.value >= minA && b.value <= maxA ? null : b;
        case "<=": return b.value >= minA && b.value <= maxA ? { op: "<", value: minA, step: b.step } : b;
        case "<": return b.value > minA && b.value <= (maxA + b.step) ? { op: "<", value: minA, step: b.step } : b;
        case ">=": return b.value >= minA && b.value <= maxA ? { op: ">=", value: maxA + 1, step: b.step } : b;
        case ">": return b.value >= (minA - 1) && b.value < maxA ? { op: ">", value: maxA, step: b.step } : b;

        case "in":
        case "common":
            let copy = new Set(b.values as Set<any>);
            (b.values as Set<any>).forEach(v => (v >= minA && v <= maxA) && copy.delete(v));

            if (copy.size == 0) return null;

            return { op: b.op, values: copy };

        case "from-to":
            let [minB, maxB] = b.range;
            let minInside = minB <= maxA && minB >= minA;
            let maxInside = maxB <= maxA && maxB >= minA;

            if (minInside && maxInside) {
                return null;
            } else if (minInside) {
                return { op: "from-to", range: [minB + (maxA - minB), maxB], step: b.step };
            } else if (maxInside) {
                return { op: "from-to", range: [minB, maxB - (maxB - minA)], step: b.step };
            } else {
                return b;
            }

        default: return b;
    }
});

/**
 * Describes some criteria entities that are loaded via a query should have.
 *
 * [devnote] there is nothing preventing comparison between a number and a string,
 * since it is expected that only criteria pointing to the same property are compared
 * against each other
 */
export class Filter {
    readonly criteria: Filter.Criteria;

    constructor(criteria: Filter.Criteria) {
        this.criteria = Object.freeze(criteria);
        Object.freeze(this);
    }

    // todo: refactor into lookup table
    // todo: not all comparions are type safe
    reduce(other: Filter): Filter | null {
        let reduced: Filter.Criteria = {};

        for (let k in this.criteria) {
            if (other.criteria[k] == null) return other;

            let a = this.criteria[k];
            let b = other.criteria[k];

            switch (a.op) {
                case "!=":
                    switch (b.op) {
                        case "!=": if (a.value == b.value) break;
                        default: reduced[k] = b;
                    }
                    break;

                case "<":
                    switch (b.op) {
                        case "<": if (a.value >= b.value) break;
                        case "<=": if (a.value > b.value) break;
                        default: reduced[k] = b;
                    }
                    break;

                case "<=":
                    switch (b.op) {
                        case "<": if (a.value >= b.value) break;
                        case "<=": if (a.value >= b.value) break;
                        default: reduced[k] = b;
                    }
                    break;

                case ">":
                    switch (b.op) {
                        case ">": if (a.value <= b.value) break;
                        case ">=": if (a.value < b.value) break;
                        default: reduced[k] = b;
                    }
                    break;

                case ">=":
                    switch (b.op) {
                        case ">": if (a.value <= b.value) break;
                        case "<=": if (a.value <= b.value) break;
                        default: reduced[k] = b;
                    }
                    break;

                case "in":
                case "common":
                    switch (b.op) {
                        case "==":
                            // todo: 'as any' is a bit dirty, but right now i see no other way
                            // other than type checking for number/string beforehand
                            if ((a.values as Set<any>).has(b.value)) break;
                            reduced[k] = b;
                            break;

                        case "in":
                        case "common":
                            let copy = new Set(b.values as Set<any>);
                            (a.values as Set<any>).forEach(v => copy.delete(v));

                            if (copy.size == 0) {
                                break;
                            } else {
                                reduced[k] = { op: b.op, values: copy };
                            }
                            break;

                        default:
                            reduced[k] = b;
                    }
                    break;

                case "==":
                case "from-to":
                    let result = lookup.get(a.op)(a, b);

                    if (result == null) {
                        break;
                    }

                    reduced[k] = result;
                    break;

                default:
                    reduced[k] = b;
            }
        }

        if (Object.keys(reduced).length == 0) {
            return null;
        }

        for (let k in other.criteria) {
            if (reduced[k]) continue;

            reduced[k] = other.criteria[k];
        }

        return new Filter(reduced);
    }
}

export module Filter {
    export interface EqualityCriterion {
        op: "==" | "!=";
        value: string | number | null | boolean;
    }

    export interface PointCriterion {
        op: "<" | "<=" | ">" | ">=";
        value: number;
        step: number;
    }

    export interface SetCriterion {
        op: "in" | "common";
        values: Set<string> | Set<number>;
    }

    export interface RangeCriterion {
        op: "from-to";
        range: [number, number];
        step: number;
    }

    export type Criterion = EqualityCriterion | PointCriterion | SetCriterion | RangeCriterion;

    export type Operations = Criterion["op"];

    export interface Criteria {
        [property: string]: Criterion;
    }
}

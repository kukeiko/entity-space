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
                case "==":
                    switch (b.op) {
                        case "==": if (a.value == b.value) break;
                        default: reduced[k] = b;
                    }
                    break;

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

                case "include":
                case "intersect":
                    switch (b.op) {
                        case "==":
                            // todo: 'as any' is a bit dirty, but right now i see no other way
                            // other than type checking for number/string beforehand
                            if (a.values.has(b.value as any)) break;
                            reduced[k] = b;
                            break;

                        case "include":
                        case "intersect":
                            let copy = new Set(b.values);
                            a.values.forEach(v => copy.delete(v));

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

                case "from-to":
                    let [minA, maxA] = a.range;

                    switch (b.op) {
                        case "==":
                            // todo: possible bool/null to number/string comparison
                            if (b.value >= minA && b.value <= maxA) {
                                break;
                            }

                            reduced[k] = b;
                            break;

                        case "<=":
                            if (b.value >= minA && b.value <= maxA) {
                                reduced[k] = { op: "<=", value: minA - 1 };
                            } else {
                                reduced[k] = b;
                            }
                            break;

                        case "<":
                            if (b.value > minA && b.value <= (maxA + 1)) {
                                reduced[k] = { op: "<", value: minA };
                            } else {
                                reduced[k] = b;
                            }
                            break;

                        case ">=":
                            if (b.value >= minA && b.value <= maxA) {
                                reduced[k] = { op: ">=", value: maxA + 1 };
                            } else {
                                reduced[k] = b;
                            }
                            break;

                        case ">":
                            if (b.value >= (minA - 1) && b.value < maxA) {
                                reduced[k] = { op: ">", value: maxA };
                            } else {
                                reduced[k] = b;
                            }
                            break;

                        case "include":
                        case "intersect":
                            let copy = new Set(b.values);

                            b.values.forEach(v => (v >= minA && v <= maxA) && copy.delete(v));

                            if (copy.size == 0) {
                                break;
                            } else {
                                reduced[k] = { op: b.op, values: copy };
                            }
                            break;

                        case "from-to":
                            let [minB, maxB] = b.range;
                            let minInside = minB <= maxA && minB >= minA;
                            let maxInside = maxB <= maxA && maxB >= minA;

                            if (minInside && maxInside) {
                                break;
                            } else if (minInside) {
                                reduced[k] = { op: "from-to", range: [minB + (maxA - minB) + 1, maxB] };
                            } else if (maxInside) {
                                reduced[k] = { op: "from-to", range: [minB, maxB - (maxB - minA) - 1] };
                            } else {
                                reduced[k] = b;
                            }
                            break;

                        default:
                            reduced[k] = b;
                    }
                    break;

                case "between":
                    // todo: implement
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
    export type Value = null | string | number;

    export interface EqualityCriterion {
        op: "==" | "!=";
        value: string | number | null | true | false;
    }

    export interface PointCriterion {
        op: "<" | "<=" | ">" | ">=";
        value: string | number;
    }

    export interface SetCriterion {
        op: "include" | "intersect";
        values: Set<string | number>;
    }

    export interface RangeCriterion {
        op: "from-to" | "between";
        range: [number, number];
    }

    export type Criterion = EqualityCriterion | PointCriterion | SetCriterion | RangeCriterion;

    export interface Criteria {
        [property: string]: Criterion;
    }
}

// export module Filter {
//     export type SingleOperator = "==" | "!=" | "<" | "<=" | ">" | ">=";
//     export type SetOperator = "include" | "intersect";
//     export type RangeOperator = "from-to" | "between";
//     export type Value = null | string | number | true | false;

//     export type Expression
//         = [SingleOperator, Value]
//         | [RangeOperator, [Value, Value]]
//         | [SetOperator, Set<Value>];

//     export type Criteria = { [property: string]: Filter.Expression };
// }

// type Member = [string];
// type Value = null | string | number | Date | true | false;
// type Operand = Member | Value;

// type Logical = "&&" | "||" | "!=" | "==" | "<=" | ">=";
// type Operator = Logical;

// type Expression = [Operand, Operator, Operand];
// // type Criteria = Expression | [Expression, Operator, Expression];


// class Criteria {
//     and(exp: Expression | Criteria): Criteria {
//         return this;
//     }

//     or(exp: Expression | Criteria): Criteria {
//         return this;
//     }
// }

// function Where(expression: Expression): Criteria {
//     return new Criteria();
// }

// let x = new Criteria()
//     .and([["foo"], "==", "123"])
//     .or(Where([["created"], "<=", new Date()])
//         .or(null)
//     )


// function foo(ex: Criteria): void {

// }

// foo([
//     [["foo"], "==", true],
//     "!=",
//     [["foo"], "<=", new Date()]
// ]);

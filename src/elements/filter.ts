export class Filter {
    readonly criteria: Filter.Criteria;

    constructor(criteria: Filter.Criteria) {
        this.criteria = Object.freeze(criteria);
        Object.freeze(this);
    }

    reduce(other: Filter): Filter | null {
        let reduced: Filter.Criteria = {};

        for (let k in this.criteria) {
            if (other.criteria[k] == null) return other;

            let a = this.criteria[k];
            let b = other.criteria[k];

            switch (a[0]) {
                case "==":
                    switch (b[0]) {
                        case "==": if (a[1] == b[1]) break;
                        default: reduced[k] = b;
                    }
                    break;

                case "!=":
                    switch (b[0]) {
                        case "!=": if (a[1] == b[1]) break;
                        default: reduced[k] = b;
                    }
                    break;

                case "<":
                    switch (b[0]) {
                        case "<": if (a[1] >= b[1]) break;
                        case "<=": if (a[1] > b[1]) break;
                        default: reduced[k] = b;
                    }
                    break;

                case "<=":
                    switch (b[0]) {
                        case "<": if (a[1] >= b[1]) break;
                        case "<=": if (a[1] >= b[1]) break;
                        default: reduced[k] = b;
                    }
                    break;

                case ">":
                    switch (b[0]) {
                        case ">": if (a[1] <= b[1]) break;
                        case ">=": if (a[1] < b[1]) break;
                        default: reduced[k] = b;
                    }
                    break;

                case ">=":
                    switch (b[0]) {
                        case ">": if (a[1] <= b[1]) break;
                        case "<=": if (a[1] <= b[1]) break;
                        default: reduced[k] = b;
                    }
                    break;

                case "in":
                case "intersect":
                    let set = a[1] as Set<any>;
                    switch (b[0]) {
                        case "==":
                            if (set.has(b[1])) break;
                            reduced[k] = b;
                            break;

                        case "in":
                        case "intersect":
                            let copy = new Set(b[1] as Set<any>);
                            set.forEach(x => copy.delete(x));

                            if (copy.size == 0) {
                                break;
                            } else {
                                reduced[k] = ["in", copy];
                            }
                            break;

                        default:
                            reduced[k] = b;
                    }
                    break;

                case "from-to":
                    switch (b[0]) {
                        case "from-to":
                            let [minA, maxA] = a[1] as [any, any];
                            let [minB, maxB] = b[1] as [any, any];

                            let minInside = minB <= maxA && minB >= minA;
                            let maxInside = maxB <= maxA && maxB >= minA;

                            if (minInside && maxInside) {
                                break;
                            } else if (minInside) {
                                reduced[k] = ["from-to", [minB + (maxA - minB), maxB]];
                            } else if (maxInside) {
                                reduced[k] = ["from-to", [minB, maxB - (maxB - minA)]];
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
    export type SingleOperator = "==" | "!=" | "<" | "<=" | ">" | ">=";
    export type SetOperator = "in" | "intersect";
    export type RangeOperator = "from-to" | "between";
    export type Value = null | string | number | true | false;

    export type Expression
        = [SingleOperator, Value]
        | [RangeOperator, [Value, Value]]
        | [SetOperator, Set<Value>];

    export type Criteria = { [property: string]: Filter.Expression };
}

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

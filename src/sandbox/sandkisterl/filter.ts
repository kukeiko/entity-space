/**
 * [notes]
 * i want proper and/or support for users:
 *  - a single filter should be a bag where each property points to an array of criterions
 *  - name of property is name of entity property to filter
 *  - array of criterions in a property are always combined with or
 *  - criterions across properties are always combined with and
 *  - user can also chain filters together which are then also combined with an or
 *
 * this way any filtering use case a user might have should be covered (such as the work-item filter builder @ oldschool TFS)
 */
export module Filter {
    // [note] purpose: "and" two filters together per property
    export function combineFilter(a: any, b: any): any {

    }

    export function combineCriteria(a: Criteria, b: Criteria): Criteria | null {
        let combined: Criteria = {};

        for (let k in a) {
            let c: Criterion | null = a[k];

            if (b[k]) {
                c = combineCriterion(a[k], b[k]);
            }

            if (c === null) return null;

            combined[k] = c;
        }

        for (let k in b) {
            if (combined[k]) continue;
            combined[k] = b[k];
        }

        return combined;
    }

    /**
     * Combines two criteria to create a new criterion that satisfies both.
     *
     * Returns null if combined criteria would be unreachable (e.g. <0 && >0)
     */
    export function combineCriterion(a: Criterion, b: Criterion): Criterion | null {
        switch (a.op) {
            case "custom": return a.combine(b);
            case "==":
                switch (b.op) {
                    case "custom": return b.combine(a);
                    case "==": return a.value === b.value ? b : null;
                }
                break;
        }

        return null;
    }

    export function reduceCriterion(a: Criterion, b: Criterion): Criterion | null {
        switch (a.op) {
            case "custom": return a.reduce(b);

            case "==":
                switch (b.op) {
                    case "custom": return b.reduceSelf(a);
                    case "==": return a.value === b.value ? null : b;
                    case "!=": return a.value === b.value ? b : { op: "not-in", values: new Set([a.value, b.value]) };
                    case "<=": return a.value === b.value ? { op: "<", value: a.value } : b;
                    case ">=": return a.value === b.value ? { op: ">", value: a.value } : b;

                    case "from-to": {
                        let from = b.from;
                        let to = b.to;

                        if (from.op === ">=" && from.value === a.value) {
                            from = { op: ">", value: a.value };
                        }

                        if (to.op === "<=" && to.value === a.value) {
                            to = { op: "<", value: a.value }
                        }

                        return (from == b.from && to == b.to) ? b : { op: "from-to", from: from, to: to };
                    }

                    case "in":
                        if (b.values.has(a.value)) {
                            if (b.values.size === 1) return null;

                            let copy = new Set(b.values);
                            copy.delete(a.value);

                            return copy.size === 1
                                ? { op: "==", value: copy.values().next().value }
                                : { op: "in", values: copy };
                        } else {
                            return b;
                        }

                    case "not-in":
                        if (!b.values.has(a.value)) {
                            let copy = new Set(b.values);
                            copy.add(a.value);

                            return { op: "not-in", values: copy };
                        } else {
                            return b;
                        }

                    default: return b;
                }

            // case "!="
        }


        return b;
    }

    export interface EqualityCriterion {
        op: "==" | "!=";
        value: boolean | number | string | null;
    }

    export interface FromCriterion {
        op: ">" | ">=";
        value: number | string;
    }

    export interface ToCriterion {
        op: "<" | "<=";
        value: number | string;
    }

    export interface MemberCriterion {
        op: "in" | "not-in";
        values: Set<boolean | number | string | null>;
    }

    export interface NeverCriterion {
        op: "never";
    }

    export interface RangeCriterion {
        op: "from-to";
        from: FromCriterion;
        to: ToCriterion;
    }

    export interface CustomCriterion {
        op: "custom";
        combine(other: Criterion): Criterion | null;
        reduce(other: Criterion): Criterion | null;
        reduceSelf(by: Criterion): Criterion | null;
    }

    // export type Criterion = CustomCriterion | EqualityCriterion | FromCriterion | MemberCriterion | NeverCriterion | RangeCriterion | ToCriterion;
    export type Criterion = CustomCriterion | EqualityCriterion | FromCriterion | MemberCriterion | RangeCriterion | ToCriterion;

    export interface Criteria {
        [k: string]: Criterion;
    }
}

interface FooCriterion extends Filter.CustomCriterion {
    foo: "bar";
}

export module FooCriterion {
    export function is(x: any): x is FooCriterion {
        return x.foo === "bar";
    }
}

let foo: FooCriterion = {
    foo: "bar",
    op: "custom",
    reduce(other) { return other; },
    combine() { return null; },
    reduceSelf(other) {
        return FooCriterion.is(other) ? null : this;
    }
};



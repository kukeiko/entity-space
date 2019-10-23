import { EqualityCriterion } from "./equality-criterion";

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
    values: Set<EqualityCriterion["value"]>;
}

export interface FromToCriterion {
    op: "from-to";
    from: FromCriterion;
    to: ToCriterion;
}

export interface CustomCriterion {
    op: "custom";
    combine(other: Criterion): Criterion | null;
    reduce(other: Criterion): Criterion | null;
    reduceBy(by: Criterion): Criterion | null;
}

export type Criterion = CustomCriterion | EqualityCriterion | FromCriterion | MemberCriterion | FromToCriterion | ToCriterion;

/**
 * Combines two criteria to create a new criterion that satisfies both.
 *
 * Returns null if combined criteria would be unreachable (e.g. < 0 && > 0)
 *
 * [todo] unfinished
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

/**
 * Make b smaller by reducing it by a.
 * [todo] unfinished
 */
export function reduceCriterion(a: Criterion, b: Criterion): Criterion | null {
    switch (a.op) {
        case "custom": return a.reduce(b);

        case "==":
            switch (b.op) {
                case "custom": return b.reduceBy(a);
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
                        to = { op: "<", value: a.value };
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


export function equals<T extends EqualityCriterion["value"]>(value: T, invert = false): EqualityCriterion {
    return { op: invert ? "!=" : "==", value: value };
}

export function notEquals<T extends EqualityCriterion["value"]>(value: T, invert = false): EqualityCriterion {
    return { op: invert ? "==" : "!=", value: value };
}

export function from<T extends FromCriterion["value"]>(value: T, inclusive = false): FromCriterion {
    return { op: inclusive ? ">=" : ">", value: value };
}

export function to<T extends ToCriterion["value"]>(value: T, inclusive = false): ToCriterion {
    return { op: inclusive ? "<=" : "<", value: value };
}

export function fromTo<T extends FromCriterion["value"], U extends ToCriterion["value"]>(values: [T, U], inclusive: boolean | [boolean, boolean] = true): FromToCriterion {
    if (typeof (inclusive) === "boolean") {
        inclusive = [inclusive, inclusive];
    }

    return { op: "from-to", from: from(values[0], inclusive[0]), to: to(values[1], inclusive[1]) };
}

export function memberOf<T extends EqualityCriterion["value"]>(values: Iterable<T>, invert = false): MemberCriterion {
    return { op: invert ? "not-in" : "in", values: new Set(values) };
}

export function notMemberOf<T extends EqualityCriterion["value"]>(values: Iterable<T>, invert = false): MemberCriterion {
    return { op: invert ? "in" : "not-in", values: new Set(values) };
}

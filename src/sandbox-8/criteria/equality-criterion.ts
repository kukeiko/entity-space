import { Criterion } from "./criterion";

export interface EqualityCriterion {
    op: "==" | "!=";
    value: boolean | number | string | null;
}

export module EqualityCriterion {
    /**
     * [todo]
     * unfinished
     */
    export function reduce(a: EqualityCriterion, b: Criterion): Criterion | null {
        switch (a.op) {
            case "!=": return b;
            case "==": {
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
            }

            default: throw new Error(`unexpected criterion op '${a.op}'`);
        }
    }
}

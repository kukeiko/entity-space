import { subtractSets } from "../../../utils";
import { ValueCriterion } from "../value-criterion";
import { InValueCriterion } from "./in-value-criterion";

export function reduceInValueCriterion(a: InValueCriterion, b: ValueCriterion): InValueCriterion | null {
    switch (b.op) {
        case "in": {
            const substracted = subtractSets(a.values, b.values);

            if (substracted.size === a.values.size) {
                return a;
            } else if (substracted.size === 0) {
                return null;
            } else {
                return { op: "in", values: substracted };
            }
        }

        case "not-in": {
            const values = new Set(a.values);

            for (const value of a.values) {
                if (!b.values.has(value)) {
                    values.delete(value);
                }
            }

            if (values.size === a.values.size) {
                return a;
            } else if (values.size === 0) {
                return null;
            } else {
                return { op: "in", values };
            }
        }
    }

    return a;
}

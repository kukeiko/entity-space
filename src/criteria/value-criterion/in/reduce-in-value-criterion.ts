import { subtractSets } from "../../../utils";
import { ValueCriteria } from "../value-criteria";
import { ValueCriterion } from "../value-criterion";
import { InValueCriterion } from "./in-value-criterion";

export function reduceInValueCriterion(a: InValueCriterion, b: ValueCriterion): ValueCriteria {
    switch (b.op) {
        case "in": {
            const subtracted = subtractSets(a.values, b.values);

            if (subtracted.size === a.values.size) {
                return [a];
            } else if (subtracted.size === 0) {
                return [];
            } else {
                return [{ op: "in", values: subtracted }];
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
                return [a];
            } else if (values.size === 0) {
                return [];
            } else {
                return [{ op: "in", values }];
            }
        }
    }

    return [a];
}

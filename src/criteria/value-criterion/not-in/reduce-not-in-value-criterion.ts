import { subtractSets } from "../../../utils";
import { ValueCriterion } from "../value-criterion";
import { NotInValueCriterion } from "./not-in-value-criterion";

export function reduceNotInValueCriterion(a: NotInValueCriterion, b: ValueCriterion): ValueCriterion | null {
    switch (b.op) {
        case "in":
            const merged = new Set([...a.values, ...b.values]);

            return { op: "not-in", values: merged };

        case "not-in":
            const remaining = subtractSets(b.values, a.values);

            if (remaining.size === 0) {
                return null;
            }

            return { op: "in", values: remaining };
    }

    return a;
}
import { subtractSets } from "../../../utils";
import { ValueCriteria } from "../value-criteria";
import { ValueCriterion } from "../value-criterion";
import { NotInSetCriterion } from "./not-in-set-criterion";

export function reduceNotInSet(a: NotInSetCriterion, b: ValueCriterion): ValueCriteria | false {
    switch (b.op) {
        case "in":
            const merged = new Set([...a.values, ...b.values]);

            return [{ op: "not-in", values: merged }];

        case "not-in":
            const remaining = subtractSets(b.values, a.values);

            if (remaining.size === 0) {
                return [];
            }

            return [{ op: "in", values: remaining }];
    }

    return false;
}
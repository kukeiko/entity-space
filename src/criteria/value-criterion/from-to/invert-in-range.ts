import { ValueCriteria } from "../value-criteria";
import { InRangeCriterion } from "./in-range-criterion";

export function invertInRange(criterion: InRangeCriterion): ValueCriteria {
    const inverted: ValueCriteria = [];

    if (criterion.from?.op !== void 0) {
        if (criterion.from.op === ">") {
            inverted.push({ op: "from-to", to: { op: "<=", value: criterion.from.value } });
        } else {
            inverted.push({ op: "from-to", to: { op: "<", value: criterion.from.value } });
        }
    }

    if (criterion.to?.op !== void 0) {
        if (criterion.to.op === "<") {
            inverted.push({ op: "from-to", from: { op: ">=", value: criterion.to.value } });
        } else {
            inverted.push({ op: "from-to", from: { op: ">", value: criterion.to.value } });
        }
    }

    return inverted;
}

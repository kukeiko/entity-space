import { ValueCriterion } from "../value-criterion";
import { InRangeCriterion } from "./in-range-criterion";
import { ValueCriteria } from "../value-criteria";
import { InRangeCriterion as new_InRangeCriterion } from "../_new-stuff/in-range-criterion";
import { InSetCriterion } from "../_new-stuff/in-set-criterion";

export function reduceInRange(a: InRangeCriterion, b: ValueCriterion): ValueCriteria | false {
    switch (b.op) {
        // [todo] revisit & try to simplify this range / range reduction.
        case "range":
            const instanceA = new_InRangeCriterion.tmp_fromOldFormat(a);
            const instanceB = new_InRangeCriterion.tmp_fromOldFormat(b);
            const result = instanceB.reduce(instanceA) as false | new_InRangeCriterion<any>[];

            if (result === false) {
                return false;
            } else {
                return result.map(newStyle => newStyle.tmp_toOldFormat());
            }

        case "in": {
            const instanceA = new_InRangeCriterion.tmp_fromOldFormat(a);
            const instanceB = new InSetCriterion(Number as any, b.values);
            const result = instanceB.reduce(instanceA) as false | new_InRangeCriterion<any>[];

            if (result === false) {
                return false;
            } else {
                return result.map(newStyle => newStyle.tmp_toOldFormat());
            }
        }

        case "not-in":
            // [todo] implement
            break;
    }

    return false;
}

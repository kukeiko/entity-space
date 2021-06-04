import { ValueCriteria } from "../value-criteria";
import { ValueCriterion } from "../value-criterion";
import { NotInSetCriterion } from "./not-in-set-criterion";
import { InSetCriterion as InSetCriterion_V2 } from "../_new-stuff/in-set-criterion";
import { NotInSetCriterion as NotInSetCriterion_V2 } from "../_new-stuff/not-in-set-criterion";

export function reduceNotInSet(a: NotInSetCriterion, b: ValueCriterion): ValueCriteria | false {
    switch (b.op) {
        case "in": {
            const instanceA = new NotInSetCriterion_V2(Number, a.values);
            const instanceB = new InSetCriterion_V2(Number, b.values);
            const result = instanceB.reduce(instanceA) as false | InSetCriterion_V2<any>[];

            if (result === false) {
                return false;
            } else {
                return result.map(x => ({ op: "not-in", values: new Set(x.getValues()) }));
            }
        }

        case "not-in":
            const instanceA = new NotInSetCriterion_V2(Number, a.values);
            const instanceB = new NotInSetCriterion_V2(Number, b.values);
            const result = instanceB.reduce(instanceA) as false | InSetCriterion_V2<any>[];

            if (result === false) {
                return false;
            } else {
                return result.map(x => ({ op: "in", values: new Set(x.getValues()) }));
            }
    }

    return false;
}

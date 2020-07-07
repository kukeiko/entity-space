import { GreaterValueCriterion } from "./greater-value-criterion";
import { GreaterEqualsValueCriterion } from "./greater-equals-criterion";
import { LessValueCriterion } from "./less-value-criterion";
import { LessEqualsValueCriterion } from "./less-equals-value-criterion";

type FromCriterion = GreaterValueCriterion | GreaterEqualsValueCriterion;
type ToCriterion = LessValueCriterion | LessEqualsValueCriterion;

export interface FromToValueCriterion {
    op: "from-to";
    from: FromCriterion;
    to: ToCriterion;
}

export module FromToValueCriterion {
    export function create<T extends FromCriterion["value"], U extends ToCriterion["value"]>(values: [T, U], inclusive: boolean | [boolean] | [boolean, boolean] = true): FromToValueCriterion {
        if (typeof (inclusive) === "boolean") {
            inclusive = [inclusive, inclusive];
        } else if (inclusive.length === 1) {
            inclusive = [inclusive[0], true];
        }

        return {
            op: "from-to",
            from: {
                op: inclusive[0] ? ">=" : ">",
                value: values[0]
            },
            to: {
                op: inclusive[1] ? "<=" : "<",
                value: values[1]
            }
        };
    }
}

import { FromToValueCriterion } from "./from-to-value-criterion";

export function createFromToValueCriterion<T extends FromToValueCriterion["from"]["value"], U extends FromToValueCriterion["to"]["value"]>(
    values: [T, U],
    inclusive: boolean | [boolean] | [boolean, boolean] = true
): FromToValueCriterion {
    if (typeof inclusive === "boolean") {
        inclusive = [inclusive, inclusive];
    } else if (inclusive.length === 1) {
        inclusive = [inclusive[0], true];
    }

    return {
        op: "from-to",
        from: {
            op: inclusive[0] ? ">=" : ">",
            value: values[0],
        },
        to: {
            op: inclusive[1] ? "<=" : "<",
            value: values[1],
        },
    };
}

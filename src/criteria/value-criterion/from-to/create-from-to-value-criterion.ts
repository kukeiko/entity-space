import { FromToValueCriterion } from "./from-to-value-criterion";

export function createFromToValueCriterion<T extends number | string>(
    values: [T | undefined, T | undefined],
    inclusive: boolean | [boolean] | [boolean, boolean] = true
): FromToValueCriterion {
    if (typeof inclusive === "boolean") {
        inclusive = [inclusive, inclusive];
    } else if (inclusive.length === 1) {
        inclusive = [inclusive[0], true];
    }

    const criterion: FromToValueCriterion = { op: "from-to" };

    if (values[0] !== void 0) {
        criterion.from = {
            op: inclusive[0] ? ">=" : ">",
            value: values[0],
        };
    }

    if (values[1] !== void 0) {
        criterion.to = {
            op: inclusive[1] ? "<=" : "<",
            value: values[1],
        };
    }

    return criterion;
}

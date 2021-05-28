import { InRangeCriterion } from "./in-range-criterion";

export function inRange<T extends number | string>(values: [T | undefined, T | undefined], inclusive: boolean | [boolean, boolean] = true): InRangeCriterion {
    if (typeof inclusive === "boolean") {
        inclusive = [inclusive, inclusive];
    }

    const criterion: InRangeCriterion = { op: "from-to" };

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

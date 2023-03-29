import { ICriterionShape } from "./criterion-shape.interface";
import { ICriterion } from "./criterion.interface";
import { IOrCriterion } from "./or/or-criterion.interface";
import { ReshapedCriterion } from "./reshaped-criterion";

export function reshapeOrCriteria<T extends ICriterionShape>(
    shape: T,
    criterion: IOrCriterion
): ReturnType<T["reshape"]> | false {
    const reshaped: ICriterion[] = [];
    const open: ICriterion[] = [];

    for (const item of criterion.getCriteria()) {
        const result = shape.reshape(item);

        if (result === false) {
            open.push(item);
        } else {
            reshaped.push(...result.getReshaped());
            open.push(...result.getOpen());
        }
    }

    if (reshaped.length > 0) {
        return new ReshapedCriterion(reshaped, open) as ReturnType<T["reshape"]>;
    }

    return false;
}

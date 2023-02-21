import { ICriterionShape } from "./criterion-shape.interface";
import { ICriterion } from "./criterion.interface";
import { IOrCriterion } from "./or/or-criterion.interface";
import { ReshapedCriterion } from "./reshaped-criterion";

export function reshapeOrCriteria<T extends ICriterionShape>(
    template: T,
    criterion: IOrCriterion
): ReturnType<T["reshape"]> | false {
    const remapped: ICriterion[] = [];
    const open: ICriterion[] = [];

    for (const item of criterion.getCriteria()) {
        const result = template.reshape(item);

        if (result === false) {
            open.push(item);
        } else {
            remapped.push(...result.getReshaped());
            open.push(...result.getOpen());
        }
    }

    if (remapped.length > 0) {
        return new ReshapedCriterion(remapped, open) as ReturnType<T["reshape"]>;
    }

    return false;
}

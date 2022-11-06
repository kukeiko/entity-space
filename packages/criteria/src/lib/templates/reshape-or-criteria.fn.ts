import { Criterion } from "../criterion/criterion";
import { OrCriteria } from "../criterion/or/or-criteria";
import { ICriterionShape } from "./criterion-shape.interface";
import { ReshapedCriterion } from "./reshaped-criterion";

export function reshapeOrCriteria<T extends ICriterionShape>(
    template: T,
    criterion: OrCriteria
): ReturnType<T["reshape"]> | false {
    const remapped: Criterion[] = [];
    const open: Criterion[] = [];

    for (const item of criterion.getItems()) {
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

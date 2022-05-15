import { Criterion } from "../criterion/criterion";
import { OrCriteria } from "../criterion/or/or-criteria";
import { ICriterionTemplate } from "./criterion-template.interface";
import { RemapCriterionResult } from "./remap-criterion-result";

export function remapOrCriteria<T extends ICriterionTemplate>(
    template: T,
    criterion: OrCriteria
): ReturnType<T["remap"]> | false {
    const remapped: Criterion[] = [];
    const open: Criterion[] = [];

    for (const item of criterion.getItems()) {
        const result = template.remap(item);

        if (result === false) {
            open.push(item);
        } else {
            remapped.push(...result.getCriteria());
            open.push(...result.getOpen());
        }
    }

    if (remapped.length > 0) {
        return new RemapCriterionResult(remapped, open) as ReturnType<T["remap"]>;
    }

    return false;
}

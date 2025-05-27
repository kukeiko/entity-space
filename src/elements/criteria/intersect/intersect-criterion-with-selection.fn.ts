import { EntitySelection } from "../../selection/entity-selection";
import { AndCriterion } from "../and-criterion";
import { Criterion } from "../criterion";
import { EntityCriterion } from "../entity-criterion";
import { OrCriterion } from "../or-criterion";

function intersectSelectionCore(criterion: Criterion, selection: EntitySelection): Criterion {
    if (criterion instanceof EntityCriterion) {
        const bag = { ...criterion.getCriteria() };
        const intersectedBag: Record<string, Criterion> = {};

        for (const [key, value] of Object.entries(selection)) {
            const criterion = bag[key];

            if (!value || !criterion) {
                continue;
            } else if (value === true) {
                intersectedBag[key] = criterion;
            } else {
                intersectedBag[key] = intersectSelectionCore(criterion, value);
            }
        }

        return new EntityCriterion(intersectedBag);
    } else if (criterion instanceof OrCriterion) {
        return new OrCriterion(criterion.getCriteria().map(criterion => intersectSelectionCore(criterion, selection)));
    } else if (criterion instanceof AndCriterion) {
        return new AndCriterion(criterion.getCriteria().map(criterion => intersectSelectionCore(criterion, selection)));
    } else {
        return criterion;
    }
}

export function intersectCriterionWithSelection(criterion: Criterion, selection: EntitySelection): Criterion {
    return intersectSelectionCore(criterion, selection);
}

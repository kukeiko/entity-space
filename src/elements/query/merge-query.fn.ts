import { isEqual } from "lodash";
import { mergeCriterion } from "../criteria/merge/merge-criterion.fn";
import { OrCriterion } from "../criteria/or-criterion";
import { mergeSelection } from "../selection/merge-selection.fn";
import { EntityQuery } from "./entity-query";

export function mergeQuery(queryA: EntityQuery, queryB: EntityQuery): EntityQuery | false {
    if (queryA.getSchema().getName() !== queryB.getSchema().getName()) {
        return false;
    }

    if (!isEqual(queryA.getParameters(), queryB.getParameters())) {
        return false;
    }

    const criterionA = queryA.getCriterion();
    const criterionB = queryB.getCriterion();

    if (criterionA === undefined || criterionB === undefined) {
        return queryA.with({ selection: mergeSelection(queryA.getSelection(), queryB.getSelection()) });
    }

    const mergedCriterion = mergeCriterion(criterionA, criterionB);

    if (isEqual(queryA.getSelection(), queryB.getSelection())) {
        if (mergedCriterion !== false) {
            return queryA.with({ criterion: mergedCriterion === true ? undefined : mergedCriterion });
        } else {
            return queryA.with({ criterion: new OrCriterion([criterionA, criterionB]) });
        }
    }

    return false;
}

import { isEqual } from "lodash";
import { isEquivalentCriterion } from "../criteria/functions/is-equivalent-criterion.fn";
import { isSubsetCriterion } from "../criteria/functions/is-subset-criterion.fn";
import { mergeCriterion } from "../criteria/merge/merge-criterion.fn";
import { mergeInRangeCriterion } from "../criteria/merge/merge-in-range-criterion.fn";
import { OrCriterion } from "../criteria/or-criterion";
import { mergeSelection } from "../selection/merge-selection.fn";
import { EntityPage } from "./entity-page";
import { EntityQuery } from "./entity-query";
import { isEqualParameters } from "./is-equal-parameters.fn";

export function mergeQuery(queryA: EntityQuery, queryB: EntityQuery): EntityQuery | false {
    // [todo] ❌ add "isEqualSchema()" fn
    if (queryA.getSchema().getName() !== queryB.getSchema().getName()) {
        return false;
    } else if (!isEqualParameters(queryA.getParameters(), queryB.getParameters())) {
        return false;
    }

    const criterionA = queryA.getCriterion();
    const criterionB = queryB.getCriterion();
    const sortA = queryA.getSort();
    const sortB = queryB.getSort();
    const pageA = queryA.getPage();
    const pageB = queryB.getPage();
    const selectionA = queryA.getSelection();
    const selectionB = queryB.getSelection();

    // [todo] ❌ handle case where "sort" exists, but "page" does not
    if (pageA !== undefined || pageB !== undefined) {
        if (!isEqual(selectionA, selectionB)) {
            return false;
        } else if (pageA !== undefined && pageB !== undefined) {
            if (sortA === undefined || sortB === undefined) {
                throw new Error("invalid query - 'sort' must be defined if 'page' is defined");
            } else if (!sortA.equals(sortB)) {
                return false;
            } else if (!isEquivalentCriterion(criterionA, criterionB)) {
                return false;
            }

            const mergedRange = mergeInRangeCriterion(pageA.getRange(), pageB.getRange());

            if (mergedRange === false) {
                return false;
            } else if (mergedRange === true) {
                return queryA.with({ sort: null, page: null });
            } else {
                // [todo] ❌ type assertion
                const from = mergedRange.getFrom()?.value as number | undefined;
                const to = mergedRange.getTo()?.value as number | undefined;
                const page = new EntityPage(from, to);
                return queryA.with({ sort: sortA, page });
            }
        } else if (pageA !== undefined) {
            if (isSubsetCriterion(criterionA, criterionB)) {
                return queryB;
            } else {
                return false;
            }
        } else if (pageB !== undefined) {
            if (isSubsetCriterion(criterionB, criterionA)) {
                return queryA;
            } else {
                return false;
            }
        }
    }

    if (criterionA === undefined) {
        const selection = mergeSelection(queryA.getSelection(), queryB.getSelection());
        return queryA.with({ selection });
    } else if (criterionB === undefined) {
        const selection = mergeSelection(queryA.getSelection(), queryB.getSelection());
        return queryB.with({ selection });
    }

    const mergedCriterion = mergeCriterion(criterionA, criterionB);

    if (isEqual(queryA.getSelection(), queryB.getSelection())) {
        if (mergedCriterion !== false) {
            return queryA.with({ criterion: mergedCriterion === true ? null : mergedCriterion });
        } else {
            return queryA.with({ criterion: new OrCriterion([criterionA, criterionB]) });
        }
    }

    return false;
}

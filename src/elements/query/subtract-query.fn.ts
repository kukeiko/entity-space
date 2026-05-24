import { is } from "@entity-space/utils";
import { isEqual } from "lodash";
import { Criterion } from "../criteria/criterion";
import { isEquivalentCriterion } from "../criteria/functions/is-equivalent-criterion.fn";
import { isSubsetCriterion } from "../criteria/functions/is-subset-criterion.fn";
import { InRangeCriterion } from "../criteria/in-range-criterion";
import { intersectCriterion } from "../criteria/intersect/intersect-criterion.fn";
import { subtractByInRangeCriterion } from "../criteria/subtract/subtract-by-in-range-criterion.fn";
import { subtractCriterion } from "../criteria/subtract/subtract-criterion.fn";
import { EntitySort } from "../entity/entity-sort";
import { EntitySelection } from "../selection/entity-selection";
import { subtractSelection } from "../selection/subtract-selection.fn";
import { EntityPage } from "./entity-page";
import { EntityQuery } from "./entity-query";
import { isEqualParameters } from "./is-equal-parameters.fn";

interface SubtractedParts {
    criterion: Criterion | true;
    selection: EntitySelection | true;
    parameters: true;
    sort: EntitySort | true;
    page: EntityPage | true;
}

function subtractParts(what: EntityQuery, by: EntityQuery): SubtractedParts | false {
    const parameters = isEqualParameters(what.getParameters(), by.getParameters());

    if (!parameters) {
        return false;
    }

    const whatCriterion = what.getCriterion();
    const byCriterion = by.getCriterion();
    const whatSelection = what.getSelection();
    const bySelection = by.getSelection();
    const sortWhat = what.getSort();
    const sortBy = by.getSort();
    const pageWhat = what.getPage();
    const pageBy = by.getPage();

    // [todo] ❌ handle case where "sort" exists, but "page" does not
    if (pageWhat !== undefined || pageBy !== undefined) {
        if (!isEqual(whatSelection, bySelection)) {
            return false;
        } else if (pageWhat !== undefined && pageBy !== undefined) {
            if (sortWhat === undefined || sortBy === undefined) {
                throw new Error("invalid query - 'sort' must be defined if 'page' is defined");
            }

            if (!sortWhat.equals(sortBy)) {
                return false;
            } else if (!isEquivalentCriterion(whatCriterion, byCriterion)) {
                return false;
            }

            const subtractedRange = subtractByInRangeCriterion(pageBy.getRange(), pageWhat.getRange());

            if (subtractedRange === false) {
                return false;
            } else if (subtractedRange === true) {
                return { criterion: true, selection: true, parameters: true, sort: true, page: true };
            } else if (subtractedRange instanceof InRangeCriterion) {
                // [todo] ❌ type assertion
                let from = subtractedRange.getFrom()?.value as number | undefined;
                let to = subtractedRange.getTo()?.value as number | undefined;

                if (from !== undefined && !subtractedRange.getFrom()?.inclusive) {
                    from = from + 1;
                }

                if (to !== undefined && !subtractedRange.getTo()?.inclusive) {
                    to = to - 1;
                }

                const page = new EntityPage(from, to);
                return { criterion: true, selection: true, parameters: true, sort: sortWhat, page };
            } else {
                return false;
            }
        } else if (pageWhat !== undefined) {
            if (sortWhat === undefined) {
                throw new Error("invalid query - 'sort' must be defined if 'page' is defined");
            }

            if (isSubsetCriterion(whatCriterion, byCriterion)) {
                return { criterion: true, selection: true, parameters: true, sort: true, page: true };
            } else {
                return false;
            }
        } else {
            return false;
        }
    }

    const selection = subtractSelection(what.getSelection(), by.getSelection());

    if (!selection) {
        return false;
    }

    let criterion: Criterion | true;

    if (byCriterion === undefined) {
        criterion = true;
    } else if (whatCriterion === undefined) {
        return false;
    } else {
        const subtracted = subtractCriterion(whatCriterion, byCriterion);

        if (!subtracted) {
            return false;
        }

        criterion = subtracted;
    }

    return { criterion, selection, parameters, sort: true, page: true };
}

export function subtractQuery(what: EntityQuery, by: EntityQuery): EntityQuery[] | boolean {
    if (what.getSchema().getName() !== by.getSchema().getName()) {
        return false;
    }

    const subtractedParts = subtractParts(what, by);

    if (!subtractedParts) {
        return false;
    } else if (Object.values(subtractedParts).every(is(true))) {
        return true;
    }

    const subtractedQueries: EntityQuery[] = [];
    let criterion = what.getCriterion();

    if (subtractedParts.criterion !== true) {
        subtractedQueries.push(what.with({ criterion: subtractedParts.criterion }));

        const whatCriterion = what.getCriterion();
        const byCriterion = by.getCriterion();

        if (whatCriterion && byCriterion) {
            const intersection = intersectCriterion(whatCriterion, byCriterion);

            if (intersection === false) {
                throw new Error("invalid criterion implementation");
            } else {
                criterion = intersection;
            }
        }
    }

    if (subtractedParts.selection !== true) {
        subtractedQueries.push(what.with({ selection: subtractedParts.selection, criterion }));
    }

    if (subtractedParts.page !== true) {
        subtractedQueries.push(what.with({ page: subtractedParts.page, criterion }));
    }

    return subtractedQueries;
}

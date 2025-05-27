import { is } from "@entity-space/utils";
import { isEqual } from "lodash";
import { Criterion } from "../criteria/criterion";
import { intersectCriterion } from "../criteria/intersect/intersect-criterion.fn";
import { subtractCriterion } from "../criteria/subtract/subtract-criterion.fn";
import { EntitySelection } from "../selection/entity-selection";
import { subtractSelection } from "../selection/subtract-selection.fn";
import { EntityQuery } from "./entity-query";

interface SubtractedParts {
    criterion: Criterion | true;
    selection: EntitySelection | true;
    parameters: true;
}

function subtractParts(what: EntityQuery, by: EntityQuery): SubtractedParts | false {
    if (!isEqual(what.getParameters(), by.getParameters())) {
        return false;
    }

    const selection = subtractSelection(what.getSelection(), by.getSelection());

    if (!selection) {
        return false;
    }

    let criterion: Criterion | true;
    const whatCriterion = what.getCriterion();
    const byCriterion = by.getCriterion();

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

    return { criterion, selection, parameters: true };
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

    return subtractedQueries;
}

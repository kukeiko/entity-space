import { EntitySchema, EntitySelection, cloneSelection, mergeSelections } from "@entity-space/elements";
import { isEqual } from "lodash";
import { EntityServiceContainer } from "../../entity-service-container";
import { getHydrators } from "../../hydration/functions/get-hydrators.fn";

export function expandSourcedSelection(
    services: EntityServiceContainer,
    schema: EntitySchema,
    sourcedSelection: EntitySelection,
): EntitySelection {
    let expandedSelection = cloneSelection(sourcedSelection);

    while (true) {
        const hydrators = getHydrators(services, schema, expandedSelection);

        const nextExpandedSelection = hydrators.reduce((previous, current) => {
            const next = current.expand(schema, previous);
            return next ? mergeSelections([previous, next]) : previous;
        }, expandedSelection);

        if (isEqual(nextExpandedSelection, expandedSelection)) {
            break;
        } else {
            expandedSelection = nextExpandedSelection;
        }
    }

    return expandedSelection;
}

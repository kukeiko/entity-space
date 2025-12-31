import { mergeSelections } from "@entity-space/elements";
import { AcceptedEntityHydration } from "../accepted-entity-hydration";

export function mergeAcceptedEntityHydrations(hydrations: AcceptedEntityHydration[]): AcceptedEntityHydration {
    const acceptedSelection = mergeSelections(hydrations.map(hydration => hydration.getAcceptedSelection()));
    const requiredSelection = mergeSelections(hydrations.map(hydration => hydration.getRequiredSelection()));

    return new AcceptedEntityHydration(acceptedSelection, requiredSelection, async ({ entities, context }) => {
        await Promise.all(hydrations.map(hydrator => hydrator.hydrateEntities(entities, context)));
    });
}

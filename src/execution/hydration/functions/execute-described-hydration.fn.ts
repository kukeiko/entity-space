import {
    Criterion,
    Entity,
    EntitySelection,
    intersectCriterionWithSelection,
    isHydrated,
    mergeSelections,
} from "@entity-space/elements";
import { EntityQueryExecutionContext } from "../../entity-query-execution-context";
import { DescribedEntityHydration } from "../described-entity-hydration";

export async function executeDescribedHydration(
    entities: Entity[],
    initialAvailableSelection: EntitySelection,
    hydrationDescription: DescribedEntityHydration,
    context: EntityQueryExecutionContext,
    criterion?: Criterion,
    parameters?: Entity,
): Promise<Entity[]> {
    let availableSelection = initialAvailableSelection;

    for (const acceptedHydrations of hydrationDescription.getAcceptedHydrations()) {
        await Promise.all(
            acceptedHydrations.map(acceptedHydration =>
                acceptedHydration.hydrateEntities(entities, context, parameters),
            ),
        );

        availableSelection = mergeSelections([
            availableSelection,
            ...acceptedHydrations.map(acceptedHydration => acceptedHydration.getAcceptedSelection()),
        ]);

        if (criterion) {
            const withoutDehydrated = intersectCriterionWithSelection(criterion, availableSelection);
            entities = entities.filter(entity => withoutDehydrated.contains(entity));
            entities = entities.filter(entity => isHydrated(entity, availableSelection));
        }
    }

    return entities;
}

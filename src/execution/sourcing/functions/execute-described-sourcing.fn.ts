import {
    Entity,
    EntityQuery,
    deduplicateEntities,
    intersectCriterionWithSelection,
    sortEntitiesByDefaultSorter,
} from "@entity-space/elements";
import { EntityQueryExecutionContext } from "../../entity-query-execution-context";
import { DescribedEntitySourcing } from "../described-entity-sourcing";

export async function executeDescribedSourcing(
    sourcingDescription: DescribedEntitySourcing,
    context: EntityQueryExecutionContext,
    query: EntityQuery,
): Promise<Entity[]> {
    const sourcings = sourcingDescription.getAcceptedSourcings();
    const nestedEntities = await Promise.all(sourcings.map(sourcing => sourcing.sourceEntities(query, context)));
    let entities = nestedEntities.flat();

    if (sourcings.length > 1 && query.getSchema().hasId()) {
        entities = deduplicateEntities(query.getSchema(), entities);
    }

    const criterion = query.getCriterion();

    if (criterion) {
        const withoutDehydrated = intersectCriterionWithSelection(
            criterion,
            sourcingDescription.getAvailableSelection(),
        );
        entities = entities.filter(entity => withoutDehydrated.contains(entity));
    }

    if (query.getParameters() === undefined && query.getPage() === undefined) {
        // [todo] ❓ note sure sorting here is required as we're already sorting in executeDescribed()
        entities = sortEntitiesByDefaultSorter(query.getSchema(), entities);
    }

    return entities;
}

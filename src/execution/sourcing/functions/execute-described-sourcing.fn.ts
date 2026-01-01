import { Entity, EntityQuery, deduplicateEntities, intersectCriterionWithSelection } from "@entity-space/elements";
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

    if (query.getParameters() === undefined) {
        const sorter = query.getSchema().getSorter();

        if (sorter) {
            entities.sort(sorter);
        }
    }

    return entities;
}

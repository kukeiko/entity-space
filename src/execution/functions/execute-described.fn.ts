import { Entity, EntityQuery, isHydrated } from "@entity-space/elements";
import { DescribedEntityQueryExecution } from "../described-entity-query-execution";
import { EntityQueryExecutionContext } from "../entity-query-execution-context";
import { executeDescribedHydration } from "../hydration/functions/execute-described-hydration.fn";
import { executeDescribedSourcing } from "../sourcing/functions/execute-described-sourcing.fn";

export async function executeDescribed(
    description: DescribedEntityQueryExecution,
    context: EntityQueryExecutionContext,
    query: EntityQuery,
): Promise<Entity[]> {
    let entities = await executeDescribedSourcing(description.getDescribedSourcing(), context, query);
    const describedHydration = description.getDescribedHydration();

    if (!describedHydration) {
        return entities;
    }

    entities = await executeDescribedHydration(
        entities,
        description.getDescribedSourcing().getAvailableSelection(),
        describedHydration,
        context,
        query.getCriterion(),
        query.getParameters()?.getValue(),
    );

    entities = entities.filter(entity => isHydrated(entity, query.getSelection()));

    return entities;
}

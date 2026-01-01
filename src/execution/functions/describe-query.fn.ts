import { EntityQuery, queryToShape } from "@entity-space/elements";
import { DescribedEntityQueryExecution } from "../described-entity-query-execution";
import { EntityServiceContainer } from "../entity-service-container";
import { describeHydration } from "../hydration/functions/describe-hydration.fn";
import { describeSourcing } from "../sourcing/functions/describe-sourcing.fn";

export function describeQuery(
    services: EntityServiceContainer,
    query: EntityQuery,
): [DescribedEntityQueryExecution, EntityQuery] | false {
    const queryShape = queryToShape(query);
    const describedSourcing = describeSourcing(services, queryShape);

    if (describedSourcing === false) {
        return false;
    }

    query = query.with({ selection: describedSourcing.getTargetSelection() });

    const describedHydration = describedSourcing.getOpenSelection()
        ? describeHydration(services, describedSourcing)
        : undefined;

    if (describedHydration === false) {
        return false;
    }

    return [new DescribedEntityQueryExecution(describedSourcing, describedHydration), query];
}

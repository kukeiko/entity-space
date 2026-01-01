import { EntityQuery } from "@entity-space/elements";
import { EntityQueryExecutionContext } from "../entity-query-execution-context";
import { EntityServiceContainer } from "../entity-service-container";
import { describeQuery } from "./describe-query.fn";
import { executeDescribed } from "./execute-described.fn";

export async function executeQuery<T>(
    services: EntityServiceContainer,
    query: EntityQuery,
    context: EntityQueryExecutionContext,
): Promise<T[]> {
    const result = describeQuery(services, query);

    if (result === false) {
        throw new Error(`no suitable sources found to execute query ${query}`);
    }

    const [description, expandedQuery] = result;

    return (await executeDescribed(description, context, expandedQuery)) as T[];
}

import { assignCreatedIds, assignEntitiesUsingIds, getSelection } from "@entity-space/elements";
import { upsertToCache } from "../../cache/upsert-to-cache.fn";
import { EntityServiceContainer } from "../../entity-service-container";
import { EntityMutatorType } from "../entity-mutator";
import { AcceptedEntityMutation } from "../structures/accepted-entity-mutation";
import { EntityMutationContext } from "../structures/entity-mutation-context";
import { copyEntitiesForMutationDispatch } from "./copy-entities-for-mutation-dispatch.fn";

export async function executeCreateMutation(
    mutation: AcceptedEntityMutation,
    context: EntityMutationContext,
    services: EntityServiceContainer,
): Promise<void> {
    const schema = mutation.getSchema();
    const rootEntities = mutation.getAcceptedRootEntities();

    for (const dependency of mutation.getOutboundDependencies()) {
        services.getTracing().writingDependency(dependency);
        dependency.writeIds(schema, rootEntities);
    }

    const [copies, originals] = copyEntitiesForMutationDispatch(mutation, rootEntities);
    const relationSelection = mutation.getSelection();
    const fullSelection = getSelection(schema, relationSelection);
    services.getTracing().dispatchedToMutator(schema, EntityMutatorType.Create, copies);
    const created = await mutation.mutate(copies, relationSelection, context);
    assignCreatedIds(schema, relationSelection, rootEntities, created);
    assignEntitiesUsingIds(schema, fullSelection, originals, created);

    for (const dependency of mutation.getInboundDependencies()) {
        services.getTracing().writingDependency(dependency);
        dependency.writeIds(schema, originals);
    }

    const cacheOptions = context.getOptions().cache;

    if (cacheOptions) {
        for (const entity of rootEntities) {
            upsertToCache(services, schema, entity, relationSelection, cacheOptions.key);
        }
    }
}

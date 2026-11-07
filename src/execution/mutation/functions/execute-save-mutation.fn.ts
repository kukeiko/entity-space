import { assignCreatedIds, assignEntitiesUsingIds, getSelection } from "@entity-space/elements";
import { upsertToCache } from "../../cache/upsert-to-cache.fn";
import { EntityServiceContainer } from "../../entity-service-container";
import { EntityMutatorType } from "../entity-mutator";
import { AcceptedEntityMutation } from "../structures/accepted-entity-mutation";
import { EntityMutationContext } from "../structures/entity-mutation-context";
import { copyEntitiesForMutationDispatch } from "./copy-entities-for-mutation-dispatch.fn";

export async function executeSaveMutation(
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

    const [copies, originals] = copyEntitiesForMutationDispatch(mutation, rootEntities, true);
    const relationSelection = mutation.getSelection();
    const fullSelection = getSelection(schema, relationSelection);
    services.getTracing().dispatchedToMutator(schema, EntityMutatorType.Save, copies);
    const saved = await mutation.mutate(copies, relationSelection, context);
    assignCreatedIds(schema, relationSelection, rootEntities, saved);
    assignEntitiesUsingIds(schema, fullSelection, originals, saved);

    for (const dependency of mutation.getInboundDependencies()) {
        services.getTracing().writingDependency(dependency);
        dependency.writeIds(schema, originals);
    }

    const cacheOptions = context.getOptions().cache;

    // [todo] ❓ consider upserting at the end of mutation, in workspace somewhere, to reduce reactive query triggers
    if (cacheOptions) {
        for (const entity of rootEntities) {
            upsertToCache(services, schema, entity, relationSelection, cacheOptions.key);
        }
    }

    // [todo] ❓"save" also handles delete, so we need to remove deleted entities as well somehow from the original mutation
}

import { assignCreatedIds, assignEntitiesUsingIds, getSelection } from "@entity-space/elements";
import { upsertToCache } from "../../cache/upsert-to-cache.fn";
import { EntityServiceContainer } from "../../entity-service-container";
import { AcceptedEntityMutation } from "../accepted-entity-mutation";
import { EntityMutationContext } from "../structures/entity-mutation-context";
import { copyEntityForMutation } from "./copy-entity-for-mutation.fn";

export async function executeSaveMutation(
    mutation: AcceptedEntityMutation,
    context: EntityMutationContext,
    services: EntityServiceContainer,
): Promise<void> {
    const schema = mutation.getSchema();

    for (const dependency of mutation.getOutboundDependencies()) {
        services.getTracing().writingDependency(dependency);
        dependency.writeIds(schema, mutation.getEntities());
    }

    const map = new Map(
        mutation.getEntities().map(entity => {
            const copy = copyEntityForMutation(mutation, entity, true);

            return [copy, entity];
        }),
    );

    const copies = Array.from(map.keys());
    services.getTracing().dispatchedMutation(schema, "save", copies);
    const saved = await mutation.mutate(copies, mutation.getSelection() ?? {}, context);
    assignCreatedIds(schema, mutation.getSelection() ?? {}, mutation.getEntities(), saved);
    const selection = getSelection(schema, mutation.getSelection());
    const originals = Array.from(map.values());
    assignEntitiesUsingIds(schema, selection, originals, saved);

    for (const dependency of mutation.getInboundDependencies()) {
        services.getTracing().writingDependency(dependency);
        dependency.writeIds(schema, originals);
    }

    const cacheOptions = context.getOptions().cache;

    if (cacheOptions) {
        for (const entity of mutation.getEntities()) {
            upsertToCache(services, schema, entity, mutation.getSelection(), cacheOptions.key);
        }
    }

    // [todo] ❓"save" also handles delete, so we need to remove deleted entities as well somehow from the original mutation
}

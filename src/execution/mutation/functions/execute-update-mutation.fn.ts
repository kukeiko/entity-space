import { assignEntitiesUsingIds, getSelection } from "@entity-space/elements";
import { upsertToCache } from "../../cache/upsert-to-cache.fn";
import { EntityServiceContainer } from "../../entity-service-container";
import { AcceptedEntityMutation } from "../accepted-entity-mutation";
import { EntityMutationContext } from "../structures/entity-mutation-context";
import { copyEntityForMutation } from "./copy-entity-for-mutation.fn";

export async function executeUpdateMutation(
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
            const copy = copyEntityForMutation(mutation, entity);

            return [copy, entity];
        }),
    );

    const copies = Array.from(map.keys());
    services.getTracing().dispatchedMutation(schema, "update", copies);
    const updated = await mutation.mutate(copies, mutation.getSelection() ?? {}, context);
    const originals = Array.from(map.values());
    const selection = getSelection(schema, mutation.getSelection());
    assignEntitiesUsingIds(schema, selection, originals, updated);

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
}

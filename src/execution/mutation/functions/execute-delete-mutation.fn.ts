import { toEntityPairs } from "@entity-space/elements";
import { deleteFromCache } from "../../cache/delete-from-cache.fn";
import { EntityServiceContainer } from "../../entity-service-container";
import { AcceptedEntityMutation } from "../accepted-entity-mutation";
import { EntityMutationContext } from "../structures/entity-mutation-context";
import { copyEntityForMutation } from "./copy-entity-for-mutation.fn";

export async function executeDeleteMutation(
    mutation: AcceptedEntityMutation,
    context: EntityMutationContext,
    services: EntityServiceContainer,
): Promise<void> {
    const schema = mutation.getSchema();

    // [todo] ❌ we need splice the original entities if the user just wants do "delete" (i.e. there is no previous),
    // so that in case of an error (service temporarily unavailable), and some entities have already been deleted successfully,
    // entity-space doesn't try to delete those again.

    const map = new Map(
        mutation.getPreviousEntities().map(entity => {
            const copy = copyEntityForMutation(mutation, entity);

            return [copy, entity];
        }),
    );

    const copies = Array.from(map.keys());
    services.getTracing().dispatchedMutation(schema, "delete", copies);
    const deleted = await mutation.mutate(copies, mutation.getSelection() ?? {}, context);
    const originals = Array.from(map.values());

    for (const [current, previous] of toEntityPairs(schema, originals, deleted)) {
        if (!previous) {
            throw new Error("failed to find deleted match");
        }

        const change = mutation.getChanges().find(change => change.getEntity() === current);

        if (!change) {
            throw new Error("failed to find deletion change");
        }

        // [todo] ❌ reimplement and write a test for this
        // change.removeEntity();
    }

    const cacheOptions = context.getOptions().cache;

    if (cacheOptions) {
        deleteFromCache(services, schema, mutation.getPreviousEntities(), mutation.getSelection(), cacheOptions.key);
    }
}

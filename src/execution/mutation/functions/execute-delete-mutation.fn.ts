import { toEntityPairs } from "@entity-space/elements";
import { deleteFromCache } from "../../cache/delete-from-cache.fn";
import { EntityServiceContainer } from "../../entity-service-container";
import { EntityMutatorType } from "../entity-mutator";
import { AcceptedEntityMutation } from "../structures/accepted-entity-mutation";
import { EntityMutationContext } from "../structures/entity-mutation-context";
import { copyEntitiesForMutationDispatch } from "./copy-entities-for-mutation-dispatch.fn";

export async function executeDeleteMutation(
    mutation: AcceptedEntityMutation,
    context: EntityMutationContext,
    services: EntityServiceContainer,
): Promise<void> {
    const schema = mutation.getSchema();
    const rootEntities = mutation.getAcceptedPreviousRootEntities();

    // [todo] ❌ we need to splice the original entities if the user just wants do "delete" (i.e. there is no previous),
    // so that in case of an error (service temporarily unavailable), and some entities have already been deleted successfully,
    // entity-space doesn't try to delete those again.

    const [copies, originals] = copyEntitiesForMutationDispatch(mutation, rootEntities);
    const relationSelection = mutation.getSelection();
    services.getTracing().dispatchedToMutator(schema, EntityMutatorType.Delete, copies);
    const deleted = await mutation.mutate(copies, mutation.getSelection() ?? {}, context);

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
        deleteFromCache(services, schema, rootEntities, relationSelection, cacheOptions.key);
    }
}

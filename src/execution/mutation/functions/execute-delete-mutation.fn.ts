import { copyEntity, getSelection, toEntityPairs } from "@entity-space/elements";
import { EntityQueryTracing } from "../../entity-query-tracing";
import { AcceptedEntityMutation } from "../accepted-entity-mutation";

export async function executeDeleteMutation(
    mutation: AcceptedEntityMutation,
    tracing: EntityQueryTracing,
): Promise<void> {
    const schema = mutation.getSchema();

    // [todo] ❌ we need splice the original entities if the user just wants do "delete" (i.e. there is no previous),
    // so that in case of an error (service temporarily unavailable), and some entities have already been deleted successfully,
    // entity-space doesn't try to delete those again.

    const deletableSelection = getSelection(schema, mutation.getSelection());

    const map = new Map(
        mutation.getPreviousEntities().map(entity => {
            const copy = copyEntity(
                schema,
                entity,
                deletableSelection,
                (relation, entity) =>
                    relation.isEmbedded() || mutation.getChanges().some(change => change.getEntity() === entity),
            );

            return [copy, entity];
        }),
    );

    const copies = Array.from(map.keys());
    tracing.dispatchedMutation(schema, "delete", copies);
    const deleted = await mutation.mutate(copies, mutation.getSelection() ?? {});
    const originals = Array.from(map.values());

    for (const [current, previous] of toEntityPairs(schema, originals, deleted)) {
        if (!previous) {
            throw new Error("failed to find deleted match");
        }

        const change = mutation.getChanges().find(change => change.getEntity() === current);

        if (!change) {
            throw new Error("failed to find deletion change");
        }

        change.removeEntity();
    }
}

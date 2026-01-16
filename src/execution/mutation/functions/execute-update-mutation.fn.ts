import {
    addIdSelection,
    assignEntitiesUsingIds,
    copyEntity,
    getSelection,
    isUpdatableEntityProperty,
} from "@entity-space/elements";
import { EntityQueryTracing } from "../../entity-query-tracing";
import { AcceptedEntityMutation } from "../accepted-entity-mutation";

export async function executeUpdateMutation(
    mutation: AcceptedEntityMutation,
    tracing: EntityQueryTracing,
): Promise<void> {
    const schema = mutation.getSchema();

    for (const dependency of mutation.getOutboundDependencies()) {
        tracing.writingDependency(dependency.getType(), dependency.getPath(), true);
        dependency.writeIds(schema, mutation.getEntities());
    }

    const updatableSelection = addIdSelection(
        schema,
        getSelection(schema, mutation.getSelection(), isUpdatableEntityProperty),
    );

    const map = new Map(
        mutation.getEntities().map(entity => {
            const copy = copyEntity(
                schema,
                entity,
                updatableSelection,
                (relation, entity) =>
                    relation.isEmbedded() || mutation.getChanges().some(change => change.getEntity() === entity),
            );

            return [copy, entity];
        }),
    );

    const copies = Array.from(map.keys());
    tracing.dispatchedMutation(schema, "update", copies);
    const updated = await mutation.mutate(copies, mutation.getSelection() ?? {});
    const originals = Array.from(map.values());
    const selection = getSelection(schema, mutation.getSelection() ?? {});
    assignEntitiesUsingIds(schema, selection, originals, updated);

    for (const dependency of mutation.getInboundDependencies()) {
        tracing.writingDependency(dependency.getType(), dependency.getPath(), false);
        dependency.writeIds(schema, originals);
    }
}

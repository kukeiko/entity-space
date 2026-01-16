import {
    assignCreatedIds,
    assignEntitiesUsingIds,
    copyEntity,
    getSelection,
    isCreatableEntityProperty,
} from "@entity-space/elements";
import { EntityQueryTracing } from "../../entity-query-tracing";
import { AcceptedEntityMutation } from "../accepted-entity-mutation";

export async function executeCreateMutation(
    mutation: AcceptedEntityMutation,
    tracing: EntityQueryTracing,
): Promise<void> {
    const schema = mutation.getSchema();

    for (const dependency of mutation.getOutboundDependencies()) {
        tracing.writingDependency(dependency.getType(), dependency.getPath(), true);
        dependency.writeIds(schema, mutation.getEntities());
    }

    const creatableSelection = getSelection(schema, mutation.getSelection(), isCreatableEntityProperty);

    const map = new Map(
        mutation.getEntities().map(entity => {
            const copy = copyEntity(
                schema,
                entity,
                creatableSelection,
                (relation, entity) =>
                    relation.isEmbedded() || mutation.getChanges().some(change => change.getEntity() === entity),
            );

            return [copy, entity];
        }),
    );

    const copies = Array.from(map.keys());
    tracing.dispatchedMutation(schema, "create", copies);
    const created = await mutation.mutate(copies, mutation.getSelection() ?? {});
    assignCreatedIds(schema, mutation.getSelection() ?? {}, mutation.getEntities(), created);
    const selection = getSelection(schema, mutation.getSelection() ?? {});
    const originals = Array.from(map.values());
    assignEntitiesUsingIds(schema, selection, originals, created);

    for (const dependency of mutation.getInboundDependencies()) {
        tracing.writingDependency(dependency.getType(), dependency.getPath(), false);
        dependency.writeIds(schema, originals);
    }
}

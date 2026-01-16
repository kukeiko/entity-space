import {
    addIdSelection,
    assignCreatedIds,
    assignEntitiesUsingIds,
    copyEntity,
    entityHasId,
    getSelection,
    isCreatableEntityProperty,
    isSavableEntityProperty,
    isUpdatableEntityProperty,
} from "@entity-space/elements";
import { EntityQueryTracing } from "../../entity-query-tracing";
import { AcceptedEntityMutation } from "../accepted-entity-mutation";

export async function executeSaveMutation(
    mutation: AcceptedEntityMutation,
    tracing: EntityQueryTracing,
): Promise<void> {
    const schema = mutation.getSchema();

    for (const dependency of mutation.getOutboundDependencies()) {
        tracing.writingDependency(dependency.getType(), dependency.getPath(), true);
        dependency.writeIds(schema, mutation.getEntities());
    }

    const savableSelection = addIdSelection(
        schema,
        getSelection(schema, mutation.getSelection(), isSavableEntityProperty),
    );

    const map = new Map(
        mutation.getEntities().map(entity => {
            const copy = copyEntity(schema, entity, savableSelection, undefined, (property, entity) => {
                if (property.getSchema().isIdProperty(property.getName())) {
                    return true;
                }

                return entityHasId(property.getSchema(), entity)
                    ? isUpdatableEntityProperty(property)
                    : isCreatableEntityProperty(property);
            });

            return [copy, entity];
        }),
    );

    const copies = Array.from(map.keys());
    tracing.dispatchedMutation(schema, "save", copies);
    const saved = await mutation.mutate(copies, mutation.getSelection() ?? {});
    assignCreatedIds(schema, mutation.getSelection() ?? {}, mutation.getEntities(), saved);
    const selection = getSelection(schema, mutation.getSelection() ?? {});
    const originals = Array.from(map.values());
    assignEntitiesUsingIds(schema, selection, originals, saved);

    for (const dependency of mutation.getInboundDependencies()) {
        tracing.writingDependency(dependency.getType(), dependency.getPath(), false);
        dependency.writeIds(schema, originals);
    }

    // [todo] ❓"save" also handles delete, so we need to remove deleted entities as well somehow
}

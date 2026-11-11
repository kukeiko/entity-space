import { Entity, entityHasId, EntityRelationSelection, EntitySchema, relationEntries } from "@entity-space/elements";
import { ComplexKeyMap } from "@entity-space/utils";
import { AcceptedEntityMutation } from "../structures/accepted-entity-mutation";
import { PlannedEntityChange } from "../structures/entity-change";

/**
 * Groups the items of an accepted mutation by the root entity they are dispatched with. Items of an aggregate
 * (e.g. related entities handled by a save mutator) share the group of their root, so they can only be dispatched
 * - or blocked - together.
 */
export function groupBatchItems(
    mutation: AcceptedEntityMutation,
    items: readonly PlannedEntityChange[],
): Map<Entity, PlannedEntityChange[]> {
    const schema = mutation.getSchema();
    const selection = mutation.getSelection();
    const roots = getDispatchRoots(mutation);
    const itemsByEntity = new Map<Entity, PlannedEntityChange[]>();
    const groups = new Map<Entity, PlannedEntityChange[]>();
    const grouped = new Set<PlannedEntityChange>();

    for (const item of items) {
        itemsByEntity.set(item.getEntity(), [...(itemsByEntity.get(item.getEntity()) ?? []), item]);
    }

    const addToGroup = (root: Entity, entities: Iterable<Entity>) => {
        const group = groups.get(root) ?? [];

        for (const entity of entities) {
            for (const item of itemsByEntity.get(entity) ?? []) {
                if (!grouped.has(item)) {
                    grouped.add(item);
                    group.push(item);
                }
            }
        }

        groups.set(root, group);
    };

    for (const root of roots) {
        addToGroup(root, collectEntities(schema, selection, root));
    }

    // deletions of related entities handled by a save mutator: group them with the next version of their previous root
    const remaining = items.filter(item => !grouped.has(item));

    if (remaining.length && schema.hasId()) {
        const rootsById = new ComplexKeyMap<Entity, Entity>(schema.getIdPaths());

        for (const root of roots.filter(root => entityHasId(schema, root))) {
            rootsById.set(root, root);
        }

        for (const previousRoot of mutation.getPrevious().filter(entity => entityHasId(schema, entity))) {
            const root = rootsById.get(previousRoot);

            if (root !== undefined) {
                addToGroup(root, collectEntities(schema, selection, previousRoot));
            }
        }
    }

    for (const item of items.filter(item => !grouped.has(item))) {
        addToGroup(item.getEntity(), [item.getEntity()]);
    }

    return groups;
}

export function getDispatchRoots(mutation: AcceptedEntityMutation): readonly Entity[] {
    return mutation.isDelete() ? mutation.getAcceptedPreviousRootEntities() : mutation.getAcceptedRootEntities();
}

function collectEntities(
    schema: EntitySchema,
    selection: EntityRelationSelection,
    entity: Entity,
    collected = new Set<Entity>(),
): Set<Entity> {
    if (collected.has(entity)) {
        return collected;
    }

    collected.add(entity);

    for (const [relation, relatedSchema, selected] of relationEntries(schema, selection)) {
        for (const related of relation.readValueAsArray(entity)) {
            collectEntities(relatedSchema, selected, related, collected);
        }
    }

    return collected;
}

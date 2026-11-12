import { Entity, EntitySchema, EntitySelection } from "@entity-space/elements";

/**
 * Writes the values of changeset-owned entities back into the structurally identical entities they were cloned from,
 * Used by the save(), sync() and delete() shortcuts, which modify the entities passed to them.
 */
export function writeBackEntities(
    schema: EntitySchema,
    selection: EntitySelection,
    targets: readonly Entity[],
    sources: readonly Entity[],
    visited = new Set<Entity>(),
): void {
    for (let i = 0; i < Math.min(targets.length, sources.length); i++) {
        const [target, source] = [targets[i], sources[i]];

        if (visited.has(target)) {
            continue;
        }

        visited.add(target);

        for (const [key, selected] of Object.entries(selection)) {
            const value = source[key];

            if (value === undefined) {
                continue;
            } else if (!schema.isRelation(key)) {
                target[key] = structuredClone(value);
                continue;
            } else if (selected === true || value === null || target[key] == null) {
                continue;
            }

            const relation = schema.getRelation(key);

            writeBackEntities(
                relation.getRelatedSchema(),
                selected,
                relation.isArray() ? target[key] : [target[key]],
                relation.isArray() ? value : [value],
                visited,
            );
        }
    }
}

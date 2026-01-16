import { Entity, entityHasId, EntityRelationSelection, EntitySchema } from "@entity-space/elements";
import { joinPaths, Path, toPath } from "@entity-space/utils";
import { EntityMutationDependency } from "../entity-mutation-dependency";

export function getDeleteDependencies(
    schema: EntitySchema,
    entities: readonly Entity[],
    required: EntityRelationSelection,
    supported?: EntityRelationSelection,
    path?: Path,
): EntityMutationDependency[] {
    if (!entities.length) {
        return [];
    }

    const dependencies = Object.entries(required).flatMap(([key, selected]) => {
        const relation = schema.getRelation(key);

        if (relation.isEmbedded()) {
            const related = entities.flatMap(entity => relation.readValueAsArray(entity));

            return getDeleteDependencies(
                relation.getRelatedSchema(),
                related,
                selected,
                supported?.[key],
                path === undefined ? toPath(key) : joinPaths([path, key]),
            );
        } else if (supported === undefined || supported[key] === undefined) {
            if (relation.joinsFromId() && relation.joinsToId()) {
                throw new Error(
                    "unsupported: trying to delete dependency to a created relation that joins both from & to an id",
                );
            }

            const relatedSchema = relation.getRelatedSchema();
            const relatedDeletable = entities.flatMap(entity =>
                relation.readValueAsArray(entity).filter(entity => entityHasId(relatedSchema, entity)),
            );

            const dependencies: EntityMutationDependency[] = [];

            if (relatedDeletable.length) {
                dependencies.push(
                    new EntityMutationDependency(
                        "delete",
                        relatedSchema,
                        relatedDeletable,
                        relation.joinsFromId(),
                        path === undefined ? toPath(key) : joinPaths([path, key]),
                    ),
                );
            }

            return dependencies;
        } else {
            return [];
        }
    });

    return dependencies;
}

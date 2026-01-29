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
            const related = relation.readValuesFlat(entities);

            return getDeleteDependencies(
                relation.getRelatedSchema(),
                related,
                selected,
                supported?.[key],
                path === undefined ? toPath(key) : joinPaths([path, key]),
            );
        } else if (supported === undefined || supported[key] === undefined) {
            const relatedSchema = relation.getRelatedSchema();
            const relatedDeletable = relation
                .readValuesFlat(entities)
                .filter(entity => entityHasId(relatedSchema, entity));

            if (!relatedDeletable.length) {
                return [];
            }

            return [
                new EntityMutationDependency(
                    "delete",
                    relatedSchema,
                    relatedDeletable,
                    relation.isInbound(),
                    path === undefined ? toPath(key) : joinPaths([path, key]),
                ),
            ];
        } else {
            return [];
        }
    });

    return dependencies;
}

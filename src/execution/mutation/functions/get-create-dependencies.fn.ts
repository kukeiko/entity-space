import { Entity, entityHasId, EntityRelationSelection, EntitySchema } from "@entity-space/elements";
import { joinPaths, Path, toPath } from "@entity-space/utils";
import { EntityMutationDependency } from "../entity-mutation-dependency";

export function getCreateDependencies(
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

            return getCreateDependencies(
                relation.getRelatedSchema(),
                related,
                selected,
                supported?.[key],
                path === undefined ? toPath(key) : joinPaths([path, key]),
            );
        } else if (supported === undefined || supported[key] === undefined) {
            const relatedSchema = relation.getRelatedSchema();
            const relatedCreatable = entities.flatMap(entity =>
                relation.readValueAsArray(entity).filter(entity => !entityHasId(relatedSchema, entity)),
            );

            const dependencies: EntityMutationDependency[] = [];

            if (relatedCreatable.length) {
                dependencies.push(
                    new EntityMutationDependency(
                        "create",
                        relatedSchema,
                        relatedCreatable,
                        relation.isOutbound(),
                        path === undefined ? toPath(key) : joinPaths([path, key]),
                    ),
                );
            }

            const relatedUpdatable = entities.flatMap(entity =>
                relation.readValueAsArray(entity).filter(entity => entityHasId(relatedSchema, entity)),
            );

            if (relatedUpdatable.length) {
                dependencies.push(
                    new EntityMutationDependency(
                        "update",
                        relatedSchema,
                        relatedUpdatable,
                        relation.isOutbound(),
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

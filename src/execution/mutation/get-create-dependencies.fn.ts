import { Entity, EntityRelationSelection, EntitySchema } from "@entity-space/elements";
import { Path, joinPaths, toPath } from "@entity-space/utils";
import { entityHasId } from "../../elements/entity/entity-has-id.fn";
import { EntityMutationDependency } from "./entity-mutation-dependency";

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
            if (relation.joinsFromId() && relation.joinsToId()) {
                throw new Error(
                    "unsupported: trying to create dependency to a created relation that joins both from & to an id",
                );
            }

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
                        relation.joinsToId(),
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
                        relation.joinsToId(),
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

import { isEmpty } from "lodash";
import { EntityRelationSelection } from "../selection/entity-selection";
import { Entity } from "./entity";
import { EntityProperty } from "./entity-property";
import { EntitySchema } from "./entity-schema";

// [todo] ❌ confusing because we also have "cloneEntity()"
// [todo] ❌ a total mess
export function copyEntity(
    schema: EntitySchema,
    entity: Entity,
    selection?: EntityRelationSelection,
    propertyPredicate?: (property: EntityProperty) => boolean,
    entityPredicate?: (schema: EntitySchema, entity: Entity) => boolean,
    includeId = false,
): Entity {
    const copy: Entity = {};

    for (const [key, value] of Object.entries(entity)) {
        if (
            !(includeId && schema.isIdProperty(key)) &&
            propertyPredicate !== undefined &&
            !propertyPredicate(schema.getProperty(key))
        ) {
            continue;
        }

        if (schema.isRelation(key)) {
            if (!schema.getRelation(key).isEmbedded() && (selection === undefined || selection[key] === undefined)) {
                continue;
            } else if (
                schema.getRelation(key).isEmbedded() ||
                (selection !== undefined && selection[key] !== undefined)
            ) {
                const relation = schema.getRelation(key);
                const relatedSchema = relation.getRelatedSchema();

                if (relation.isArray()) {
                    copy[key] = (value as Entity[])
                        .filter(
                            entity =>
                                entityPredicate === undefined ||
                                relation.isEmbedded() ||
                                entityPredicate(relatedSchema, entity),
                        )
                        .map(entity =>
                            copyEntity(
                                relatedSchema,
                                entity,
                                selection ? (isEmpty(selection[key]) ? undefined : selection[key]) : undefined,
                                propertyPredicate,
                                entityPredicate,
                                includeId,
                            ),
                        );
                } else if (
                    entityPredicate === undefined ||
                    relation.isEmbedded() ||
                    entityPredicate(relatedSchema, value)
                ) {
                    copy[key] = copyEntity(
                        relatedSchema,
                        value,
                        selection ? (isEmpty(selection[key]) ? undefined : selection[key]) : undefined,
                        propertyPredicate,
                        entityPredicate,
                        includeId,
                    );
                }
            }
        } else {
            if (schema.getPrimitive(key).isArray() && Array.isArray(entity[key])) {
                copy[key] = entity[key].slice();
            } else if (entity[key] !== undefined) {
                copy[key] = entity[key];
            }
        }
    }

    return copy;
}

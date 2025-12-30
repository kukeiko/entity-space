import { EntitySelection } from "../selection/entity-selection";
import { Entity } from "./entity";
import { EntityProperty } from "./entity-property";
import { EntityRelationProperty } from "./entity-relation-property";
import { EntitySchema } from "./entity-schema";

export function copyEntities(
    schema: EntitySchema,
    entities: readonly Entity[],
    selection?: EntitySelection,
    relatedPredicate?: (relation: EntityRelationProperty, entity: Entity) => boolean,
    propertyPredicate?: (property: EntityProperty, entity: Entity) => boolean,
): Entity[] {
    if (!entities.length) {
        return [];
    } else if (selection === undefined) {
        if (relatedPredicate === undefined && propertyPredicate === undefined) {
            return JSON.parse(JSON.stringify(entities));
        } else {
            throw new Error(
                `not yet supported: copyEntities() with undefined selection but defined relatedPredicate/propertyPredicate (tried to copy entities of schema ${schema.getName()})`,
            );
        }
    }

    const copies: Entity[] = entities.map(() => ({}));

    for (const [key, selected] of Object.entries(selection)) {
        if (schema.isPrimitive(key)) {
            const primitive = schema.getPrimitive(key);

            for (let i = 0; i < entities.length; ++i) {
                if (propertyPredicate !== undefined && !propertyPredicate(schema.getProperty(key), entities[i])) {
                    continue;
                }

                const value = primitive.copyValueOf(entities[i]);

                if (value !== undefined) {
                    copies[i][key] = value;
                }
            }
        } else if (schema.isRelation(key)) {
            if (selected === true) {
                throw new Error(`invalid selection: ${schema.getName()}.${key} can not be "true"`);
            }

            const relation = schema.getRelation(key);
            const relatedSchema = relation.getRelatedSchema();

            if (relation.isArray()) {
                for (let i = 0; i < entities.length; ++i) {
                    if (propertyPredicate !== undefined && !propertyPredicate(schema.getProperty(key), entities[i])) {
                        continue;
                    }

                    const value = entities[i][key];

                    if (value === undefined) {
                        continue;
                    } else if (value == null) {
                        copies[i][key] = value;
                    } else {
                        const related =
                            relatedPredicate === undefined
                                ? value
                                : (value as Entity[]).filter(entity => relatedPredicate(relation, entity));

                        copies[i][key] = copyEntities(
                            relatedSchema,
                            related,
                            selected,
                            relatedPredicate,
                            propertyPredicate,
                        );
                    }
                }
            } else {
                for (let i = 0; i < entities.length; ++i) {
                    if (propertyPredicate !== undefined && !propertyPredicate(schema.getProperty(key), entities[i])) {
                        continue;
                    }

                    const value = entities[i][key];

                    if (value === undefined) {
                        continue;
                    } else if (value == null) {
                        copies[i][key] = value;
                    } else if (relatedPredicate === undefined || relatedPredicate(relation, value)) {
                        copies[i][key] = copyEntities(
                            relatedSchema,
                            [value],
                            selected,
                            relatedPredicate,
                            propertyPredicate,
                        )[0];
                    }
                }
            }
        }
    }

    return copies;
}

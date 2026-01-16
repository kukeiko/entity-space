import { isEmpty, isEqual,isPlainObject } from "lodash";
import { EntityRelationSelection } from "../selection/entity-selection";
import { Entity } from "./entity";
import { EntitySchema } from "./entity-schema";
import { toEntityPairs } from "./to-entity-pairs.fn";

export function getEntityDifference(
    schema: EntitySchema,
    current: Entity,
    previous: Entity,
    selection?: EntityRelationSelection,
): Entity {
    const difference: Entity = {};

    for (const [key, value] of Object.entries(current)) {
        if (schema.isRelation(key) && (!schema.getRelation(key).isEmbedded() && selection?.[key] === undefined)) {
            // skip joined relations if not selected
            continue;
        } else if (value === undefined || previous[key] === undefined) {
            continue;
        } else if (value === null && previous[key] !== null) {
            difference[key] = null;
        } else if (value !== null && previous[key] === null) {
            // [todo] ❌ should clone if is entity
            difference[key] = value;
        } else if (schema.isRelation(key)) {
            const relation = schema.getRelation(key);

            if (relation.isArray()) {
                const currentRelated = value as Entity[];
                const previousRelated = previous[key] as Entity[];
                const relatedSchema = relation.getRelatedSchema();
                const pairs = toEntityPairs(relatedSchema, currentRelated, previousRelated);
                const relatedDifference: Entity[] = [];

                for (const [current, previous] of pairs) {
                    if (previous === undefined) {
                        relatedDifference.push(current);
                    } else {
                        relatedDifference.push(
                            getEntityDifference(
                                relatedSchema,
                                current,
                                previous,
                                selection ? selection[key] : undefined,
                            ),
                        );
                    }
                }

                if (!relatedDifference.every(value => isEmpty(value))) {
                    difference[key] = relatedDifference;
                }
            } else {
                const relatedDifference = getEntityDifference(
                    schema,
                    value,
                    previous[key],
                    selection ? selection[key] : undefined,
                );

                if (!isEmpty(relatedDifference)) {
                    difference[key] = relatedDifference;
                }
            }
        } else if (!isEqual(value, previous[key])) {
            difference[key] = value;
        }
    }

    return difference;
}

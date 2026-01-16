import {
    Entity,
    EntityRelationSelection,
    EntitySchema,
    getEntityDifference,
    isPersistedEntity,
    toEntityPairs,
} from "@entity-space/elements";
import { readPath, writePath } from "@entity-space/utils";
import { isEmpty } from "lodash";
import { EntityChange } from "../entity-change";

export function getUpdateChanges(
    schema: EntitySchema,
    entities: readonly Entity[],
    selection: EntityRelationSelection,
    previousEntities?: readonly Entity[],
): EntityChange[] {
    if (!entities.length) {
        return [];
    }

    const updated: EntityChange[] = [];

    if (schema.hasId()) {
        const updatedEntities = entities.filter(entity => isPersistedEntity(schema, entity));

        if (previousEntities === undefined) {
            updated.push(...updatedEntities.map(entity => new EntityChange("update", schema, entity)));
        } else {
            const pairs = toEntityPairs(schema, updatedEntities, previousEntities);

            for (const [current, previous] of pairs) {
                const difference =
                    previous !== undefined ? getEntityDifference(schema, current, previous, selection) : current;

                if (!isEmpty(difference)) {
                    for (const idPath of schema.getIdPaths()) {
                        writePath(idPath, difference, readPath(idPath, current));
                    }

                    updated.push(new EntityChange("update", schema, current, difference));
                }
            }

            const pairedEntities = new Set(pairs.map(pair => pair[0]));

            for (const updatedUnpairedEntity of updatedEntities.filter(entity => !pairedEntities.has(entity))) {
                updated.push(new EntityChange("update", schema, updatedUnpairedEntity));
            }
        }
    }

    for (const [key, selected] of Object.entries(selection)) {
        const relation = schema.getRelation(key);
        const relatedSchema = relation.getRelatedSchema();
        const related = relation.readValuesFlat(entities);
        const previousRelated = previousEntities ? relation.readValuesFlat(previousEntities) : undefined;
        updated.push(...getUpdateChanges(relatedSchema, related, selected, previousRelated));
    }

    return updated;
}

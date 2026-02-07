import { EntityRelationSelection } from "../../selection/entity-selection";
import { Entity } from "../entity";
import { EntityMap } from "../entity-map";
import { EntitySchema } from "../entity-schema";
import { relationEntries } from "../relation-entries.fn";

export function toEntityMap(
    schema: EntitySchema,
    selection: EntityRelationSelection,
    entities: readonly Entity[],
    map = new EntityMap(),
): EntityMap {
    if (schema.hasId()) {
        for (const entity of entities) {
            map.addEntity(schema, entity);
        }
    }

    for (const [relation, relatedSchema, relatedSelection] of relationEntries(schema, selection)) {
        const related = relation.readValuesFlat(entities);

        if (!related.length) {
            continue;
        }

        toEntityMap(relatedSchema, relatedSelection, related, map);
    }

    return map;
}

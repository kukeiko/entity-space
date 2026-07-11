import { EntityRelationSelection } from "../../selection/entity-selection";
import { Entity } from "../entity";
import { EntityMap } from "../entity-map";
import { relationEntries } from "../relation-entries.fn";
import { EntitySchema } from "../schema/entity-schema";

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

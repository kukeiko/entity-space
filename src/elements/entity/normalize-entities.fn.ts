import { EntitySelection } from "../selection/entity-selection";
import { Entity } from "./entity";
import { EntitySchema } from "./schema/entity-schema";

function normalizeEntitiesCore(
    schema: EntitySchema,
    entities: readonly Entity[],
    normalized: Map<EntitySchema, Entity[]>,
    selection?: EntitySelection,
): void {
    for (const relation of schema.getRelations()) {
        const name = relation.getName();

        if (selection && selection[name] === undefined) {
            continue;
        }

        const relatedEntities = relation.readValuesFlat(entities);

        if (!relatedEntities.length) {
            continue;
        }

        const relatedSchema = relation.getRelatedSchema();

        if (relation.isJoined()) {
            for (const entity of entities) {
                delete entity[name];
            }

            if (!normalized.has(relatedSchema)) {
                normalized.set(relatedSchema, []);
            }

            normalized.get(relatedSchema)!.push(...relatedEntities);
        }

        let selectedValue: EntitySelection | undefined;

        if (selection) {
            selectedValue = selection[name] === true ? undefined : selection[name];
        }

        normalizeEntitiesCore(relatedSchema, relatedEntities, normalized, selectedValue);
    }
}

export function normalizeEntities(
    schema: EntitySchema,
    entities: readonly Entity[],
    selection?: EntitySelection,
): Map<EntitySchema, Entity[]> {
    const normalized = new Map<EntitySchema, Entity[]>();
    normalized.set(schema, entities.slice());
    normalizeEntitiesCore(schema, entities, normalized, selection);

    return normalized;
}

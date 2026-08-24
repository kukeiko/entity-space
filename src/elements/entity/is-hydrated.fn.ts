import { EntitySelection } from "../selection/entity-selection";
import { Entity } from "./entity";
import { getDiscriminatedSchemaOfEntity } from "./functions/get-discriminated-schema-of-entity.fn";
import { EntitySchema } from "./schema/entity-schema";

export function isHydrated(schema: EntitySchema, selection: EntitySelection, entity: Entity): boolean {
    if (schema.isUnionSchema()) {
        schema = getDiscriminatedSchemaOfEntity(schema, entity);
    }

    for (const [name, selected] of Object.entries(selection)) {
        if (!schema.hasProperty(name)) {
            continue;
        }

        const property = schema.getProperty(name);
        const value = property.readValue(entity);

        if (value === undefined) {
            return false;
        } else if (selected !== true && value !== null) {
            const relatedSchema = schema.getRelation(name).getRelatedSchema();

            if (Array.isArray(value)) {
                if (!(value as Entity[]).every(entity => isHydrated(relatedSchema, selected, entity))) {
                    return false;
                }
            } else {
                if (!isHydrated(relatedSchema, selected, value)) {
                    return false;
                }
            }
        }
    }

    return true;
}

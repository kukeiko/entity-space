import { Entity } from "../entity";
import { EntitySchema } from "../schema/entity-schema";

export function groupEntitiesByDiscriminator(
    schema: EntitySchema,
    entities: readonly Entity[],
): Map<EntitySchema, Entity[]> {
    const schemas = schema.getSchemas();

    if (schemas.length === 1) {
        return new Map([[schema, entities.slice()]]);
    }

    const grouped = new Map<EntitySchema, Entity[]>();

    for (const schema of schemas) {
        const discriminator = schema.getDiscriminator();
        const matching = entities.filter(entity => discriminator.readValue(entity) === discriminator.getDefaultValue());
        grouped.set(schema, matching);
    }

    return grouped;
}

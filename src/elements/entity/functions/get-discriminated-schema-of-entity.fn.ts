import { Entity } from "../entity";
import { EntitySchema } from "../schema/entity-schema";

export function getDiscriminatedSchemaOfEntity(schema: EntitySchema, entity: Entity): EntitySchema {
    if (!schema.isUnionSchema()) {
        throw new Error(`schema ${schema.getName()} is not a union schema`);
    }

    const discriminator = schema.getDiscriminator();
    const entityValue = discriminator.readValue(entity);
    const discriminatedSchema = schema
        .getSchemas()
        .find(candidate => candidate.getDiscriminator().getDefaultValue() === entityValue);

    if (!discriminatedSchema) {
        throw new Error("did not find discriminated schema");
    }

    return discriminatedSchema;
}

import { isRecord } from "@entity-space/utils";
import { Entity } from "../common/entity.type";
import { IEntitySchema, IPropertyValueSchema } from "../schema/schema.interface";
import { IEntityTools } from "./entity-tools.interface";

export class EntityTools implements IEntityTools {
    matchesSchema = (entity: Entity, schema: IEntitySchema<Entity>): boolean => {
        const openRequiredKeys = new Set(
            schema
                .getProperties()
                .filter(property => property.isRequired())
                .map(property => property.getName())
        );
        const properties = new Map(schema.getProperties().map(property => [property.getName(), property]));

        for (const key in entity) {
            const property = properties.get(key);

            if (!property) {
                return false;
            }

            if (!this.matchesValueSchema(entity[key], property.getValueSchema())) {
                return false;
            }

            openRequiredKeys.delete(key);
        }

        return !openRequiredKeys.size;
    };

    private matchesValueSchema(value: unknown, schema: IPropertyValueSchema): boolean {
        if (value === null && schema.isNullable()) {
            return true;
        } else if (schema.isArray()) {
            if (!Array.isArray(value)) {
                return false;
            }

            return value.every(value => this.matchesValueSchema(value, schema.getItemSchema()));
        } else if (schema.isPrimitive()) {
            return schema.supportsValue(value);
        } else if (schema.isEntity()) {
            if (!isRecord(value)) {
                return false;
            }

            return this.matchesSchema(value, schema);
        }

        return false;
    }
}

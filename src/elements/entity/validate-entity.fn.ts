import { primitiveToType, primitiveTypeToString } from "@entity-space/utils";
import { Entity } from "./entity";
import { isEntityPrimitiveProperty } from "./entity-primitive-property";
import { EntityProperty } from "./entity-property";
import { isEntityRelationProperty } from "./entity-relation-property";
import { EntitySchema } from "./entity-schema";

export type EntityValidationErrors = Record<string, string>;

export function validateEntity(
    schema: EntitySchema,
    entity: Entity,
    pathPrefix?: string,
    propertyPredicate?: (property: EntityProperty) => boolean,
    propertyPredicateError?: string,
): EntityValidationErrors | undefined {
    const errors: EntityValidationErrors = {};
    const properties = schema.getPropertyRecord(propertyPredicate);

    for (const [key, property] of Object.entries(properties)) {
        const path = pathPrefix ? `${pathPrefix}.${key}` : key;

        if (entity[key] === undefined) {
            if (!property.isOptional()) {
                errors[path] = `property is required`;
            }
        } else if (entity[key] === null) {
            if (!property.isNullable()) {
                errors[path] = `property is not nullable`;
            }
        } else if (Array.isArray(entity[key])) {
            if (!property.isArray()) {
                errors[path] = `property is not an array`;
            } else if (isEntityPrimitiveProperty(property)) {
                const expectedTypeName = primitiveTypeToString(property.getPrimitiveType());

                entity[key].forEach((value, index) => {
                    const valueType = primitiveToType(value);

                    if (valueType !== property.getPrimitiveType()) {
                        errors[`${path}[${index}]`] =
                            `value at index ${index} is not of type ${expectedTypeName} (got ${primitiveTypeToString(valueType)})`;
                    }
                });
            } else if (isEntityRelationProperty(property)) {
                entity[key].forEach((value, index) => {
                    const relatedErrors = validateEntity(property.getRelatedSchema(), value, `${path}[${index}]`);

                    if (relatedErrors !== undefined) {
                        Object.assign(errors, relatedErrors);
                    }
                });
            }
        } else if (isEntityPrimitiveProperty(property)) {
            const valueType = primitiveToType(entity[key]);
            const expectedTypeName = primitiveTypeToString(property.getPrimitiveType());

            if (valueType !== property.getPrimitiveType() && expectedTypeName !== "custom") {
                errors[`${path}`] =
                    `value is not of type ${expectedTypeName} (got ${primitiveTypeToString(valueType)})`;
            }
        } else if (isEntityRelationProperty(property)) {
            const relatedErrors = validateEntity(property.getRelatedSchema(), entity[key], path);

            if (relatedErrors !== undefined) {
                Object.assign(errors, relatedErrors);
            }
        }
    }

    for (const key of Object.keys(entity).filter(key => !(key in properties))) {
        const path = pathPrefix ? `${pathPrefix}.${key}` : key;

        if (propertyPredicate && schema.isProperty(key)) {
            errors[path] = propertyPredicateError ?? "property did not match custom predicate";
        } else {
            errors[path] = "property doesn't exist";
        }
    }

    return Object.keys(errors).length ? errors : undefined;
}

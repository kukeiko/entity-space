import { Class } from "@entity-space/utils";
import { Entity } from "../common/entity.type";
import { ArraySchema } from "./array-schema";
import { getEntityBlueprintMetadata, getNamedProperties, isEntityBlueprint } from "./entity-blueprint";
import { EntityBlueprintInstance } from "./entity-blueprint-instance.type";
import { BlueprintPropertyValue, hasAttribute } from "./entity-blueprint-property";
import { EntitySchema } from "./entity-schema";
import { PrimitiveSchema } from "./primitive-schema";
import { IEntitySchema, PrimitiveSchemaDataType } from "./schema.interface";

export class EntitySchemaCatalog {
    private readonly schemas = new Map<string, EntitySchema>();

    addSchema(schema: EntitySchema): this {
        this.schemas.set(schema.getId(), schema);
        return this;
    }

    getSchema<T extends Entity = Entity>(id: string): EntitySchema<T> {
        const schema = this.schemas.get(id);

        if (!schema) {
            throw new Error(`schema ${id} not found`);
        }

        return schema as EntitySchema<T>;
    }

    resolve<T>(blueprint: Class<T>): IEntitySchema<EntityBlueprintInstance<T>> {
        const metadata = getEntityBlueprintMetadata(blueprint);
        let schema = this.schemas.get(metadata.id);

        if (schema) {
            return schema as EntitySchema<EntityBlueprintInstance<T>>;
        }

        schema = new EntitySchema(metadata.id);
        this.schemas.set(metadata.id, schema);

        if (metadata.key) {
            schema.setKey(metadata.key);
        }

        if (metadata.indexes) {
            for (const name in metadata.indexes) {
                const path = metadata.indexes[name];
                schema.addIndex(path, { name });
            }
        }

        const properties = getNamedProperties(blueprint);
        const idProperties = properties.filter(hasAttribute("id"));

        if (idProperties.length > 0) {
            schema.setKey(idProperties.map(property => property.name));

            for (const idProperty of idProperties) {
                schema.addProperty(
                    idProperty.name,
                    new PrimitiveSchema(this.toPrimitiveSchemaDataType(idProperty.valueType)),
                    true
                );
            }
        }

        for (const relationProperty of properties.filter(hasAttribute("relation"))) {
            const isRequired = hasAttribute("required", relationProperty);

            if (typeof relationProperty.valueType === "object" && "$ref" in relationProperty.valueType) {
                const relatedSchema = this.getSchema(relationProperty.valueType.$ref);

                if (hasAttribute("array", relationProperty)) {
                    schema.addProperty(relationProperty.name, new ArraySchema(relatedSchema), isRequired);
                } else {
                    schema.addProperty(relationProperty.name, relatedSchema, isRequired);
                }

                schema.addRelation(relationProperty.name, relationProperty.from, relationProperty.to);
            } else if (isEntityBlueprint(relationProperty.valueType)) {
                const relatedSchema = this.resolve(relationProperty.valueType);

                if (hasAttribute("array", relationProperty)) {
                    schema.addProperty(relationProperty.name, new ArraySchema(relatedSchema), isRequired);
                } else {
                    schema.addProperty(relationProperty.name, relatedSchema, isRequired);
                }

                schema.addRelation(relationProperty.name, relationProperty.from, relationProperty.to);
            }

            // [todo] implement remaining relational value types
        }

        for (const property of properties) {
            if (hasAttribute("relation", property)) {
                continue;
            }

            const isRequired = hasAttribute("required", property);

            if (hasAttribute("array", property)) {
                if (isEntityBlueprint(property.valueType)) {
                    const relatedSchema = this.resolve(property.valueType);

                    schema.addProperty(property.name, new ArraySchema(relatedSchema), isRequired);
                } else {
                    schema.addProperty(
                        property.name,
                        new ArraySchema(new PrimitiveSchema(this.toPrimitiveSchemaDataType(property.valueType))),
                        isRequired
                    );
                }
            } else if (isEntityBlueprint(property.valueType)) {
                const relatedSchema = this.resolve(property.valueType);

                schema.addProperty(property.name, relatedSchema, isRequired);
            } else {
                schema.addProperty(
                    property.name,
                    new PrimitiveSchema(this.toPrimitiveSchemaDataType(property.valueType)),
                    isRequired
                );
            }
        }

        for (const indexedProperty of properties.filter(hasAttribute("index"))) {
            const unique = hasAttribute("unique", indexedProperty);
            schema.addIndex(indexedProperty.name, { unique });
        }

        for (const indexedProperty of properties.filter(hasAttribute("unique"))) {
            if (schema.findIndex(indexedProperty.name)) {
                continue;
            }

            schema.addIndex(indexedProperty.name, { unique: true });
        }

        return schema as EntitySchema<EntityBlueprintInstance<T>>;
    }

    private toPrimitiveSchemaDataType(valueType: BlueprintPropertyValue): PrimitiveSchemaDataType {
        switch (valueType) {
            case Number:
                return "number";
            case String:
                return "string";
            case Boolean:
                return "boolean";
            default:
                throw new Error(
                    `BlueprintPropertyValue "${valueType}" can't be converted to a PrimitiveSchemaDataType`
                );
        }
    }
}

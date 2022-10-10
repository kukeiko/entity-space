import { Class } from "@entity-space/utils";
import "reflect-metadata";
import { getBlueprintMetadata, getNamedProperties, isBlueprint } from "./blueprint";
import { BlueprintInstance } from "./blueprint-instance";
import { BlueprintPropertyValue, hasAttribute } from "./blueprint-property";
import { EntitySchema } from "./entity-schema";
import { ArraySchema } from "./array-schema";
import { PrimitiveSchema } from "./primitive-schema";
import { PrimitiveSchemaDataType } from "./schema.interface";
import { Entity } from "../entity.type";

export class EntitySchemaCatalog {
    private readonly schemas = new Map<string, EntitySchema>();

    addSchema(schema: EntitySchema): this {
        this.schemas.set(schema.getId(), schema);
        return this;
    }

    getSchema<T = Entity>(id: string): EntitySchema<T> {
        const schema = this.schemas.get(id);

        if (!schema) {
            throw new Error(`schema ${id} not found`);
        }

        return schema as EntitySchema<T>;
    }

    resolve<T>(blueprint: Class<T>): EntitySchema<BlueprintInstance<T>> {
        const metadata = getBlueprintMetadata(blueprint);
        let schema = this.schemas.get(metadata.id);

        if (schema) {
            return schema as EntitySchema<BlueprintInstance<T>>;
        }

        // console.log(`🔨 ⏳ building schema ${metadata.id} from blueprint...`);
        schema = new EntitySchema(metadata.id);
        this.schemas.set(metadata.id, schema);
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
            } else if (isBlueprint(relationProperty.valueType)) {
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
            if (hasAttribute("relation", property) || isBlueprint(property.valueType)) {
                continue;
            }

            const isRequired = hasAttribute("required", property);

            if (hasAttribute("array", property)) {
                schema.addProperty(
                    property.name,
                    new ArraySchema(new PrimitiveSchema(this.toPrimitiveSchemaDataType(property.valueType))),
                    isRequired
                );
            } else {
                schema.addProperty(
                    property.name,
                    new PrimitiveSchema(this.toPrimitiveSchemaDataType(property.valueType)),
                    isRequired
                );
            }
        }

        for (const indexedProperty of properties.filter(hasAttribute("index"))) {
            schema.addIndex(indexedProperty.name);
        }

        // console.log(`🔨 ✔️ built schema ${metadata.id}`, schema);

        return schema as EntitySchema<BlueprintInstance<T>>;
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

import { Class } from "@entity-space/utils";
import { Entity } from "../common/entity.type";
import { ArraySchema } from "./array-schema";
import { EntityBlueprint, getEntityBlueprintMetadata, getNamedProperties, isEntityBlueprint } from "./entity-blueprint";
import { EntityBlueprintInstance } from "./entity-blueprint-instance.type";
import {
    BlueprintProperty,
    BlueprintPropertyValue,
    hasAttribute,
    RelationAttribute,
} from "./entity-blueprint-property";
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

        if (this.schemas.has(metadata.id)) {
            return this.schemas.get(metadata.id) as EntitySchema<EntityBlueprintInstance<T>>;
        } else {
            return this.createSchemaFromBlueprint(blueprint);
        }
    }

    private createSchemaFromBlueprint<T>(blueprint: Class<T>): IEntitySchema<EntityBlueprintInstance<T>> {
        const metadata = getEntityBlueprintMetadata(blueprint);
        const schema = new EntitySchema(metadata.id);
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

        if (idProperties.length > 1) {
            throw new Error(
                `${schema.getId()} contains multiple properties with the "id" attribute. If you need a composite id, please define it in the ${
                    EntityBlueprint.name
                } decorator instead`
            );
        }

        // [todo] this seems funky - when I used composite keys in example apps, I never specified "key: true" on multiple properties.
        // instead, I specified the composite key in the decorator
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

        properties
            .filter(hasAttribute("relation"))
            .forEach(property => this.addRelationPropertyToSchema(schema, property.name, property));

        properties
            .filter(property => !hasAttribute("relation", property) && !hasAttribute("id", property))
            .forEach(property => this.addNonRelationalPropertyToSchema(schema, property.name, property));

        for (const indexedProperty of properties.filter(hasAttribute("index"))) {
            if (hasAttribute("id", indexedProperty)) {
                continue;
            }

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

    private addNonRelationalPropertyToSchema(schema: EntitySchema, name: string, property: BlueprintProperty): void {
        const isRequired = !hasAttribute("optional", property);

        if (hasAttribute("array", property)) {
            if (isEntityBlueprint(property.valueType)) {
                const relatedSchema = this.resolve(property.valueType);

                schema.addProperty(name, new ArraySchema(relatedSchema), isRequired);
            } else {
                schema.addProperty(
                    name,
                    new ArraySchema(new PrimitiveSchema(this.toPrimitiveSchemaDataType(property.valueType))),
                    isRequired
                );
            }
        } else if (isEntityBlueprint(property.valueType)) {
            const relatedSchema = this.resolve(property.valueType);

            schema.addProperty(name, relatedSchema, isRequired);
        } else {
            schema.addProperty(
                name,
                new PrimitiveSchema(this.toPrimitiveSchemaDataType(property.valueType)),
                isRequired
            );
        }
    }

    private addRelationPropertyToSchema(
        schema: EntitySchema,
        name: string,
        relationProperty: BlueprintProperty & RelationAttribute
    ): void {
        const isRequired = !hasAttribute("optional", relationProperty);
        let relatedSchema: IEntitySchema;

        if (typeof relationProperty.valueType === "object" && "$ref" in relationProperty.valueType) {
            relatedSchema = this.getSchema(relationProperty.valueType.$ref);
        } else if (isEntityBlueprint(relationProperty.valueType)) {
            relatedSchema = this.resolve(relationProperty.valueType);
        } else {
            throw new Error(`valueType of property ${name} is neither a Blueprint nor an object containing $ref`);
        }

        if (hasAttribute("array", relationProperty)) {
            schema.addProperty(name, new ArraySchema(relatedSchema), isRequired);
        } else {
            schema.addProperty(name, relatedSchema, isRequired);
        }

        schema.addRelation(name, relationProperty.from, relationProperty.to);

        // [todo] implement remaining relational value types
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

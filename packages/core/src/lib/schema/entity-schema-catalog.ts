import { Class, isPrimitive, isString } from "@entity-space/utils";
import { Entity } from "../common/entity.type";
import { ArraySchema } from "./array-schema";
import { EntityBlueprint, getEntityBlueprintMetadata, isEntityBlueprint, toPropertyRecord } from "./entity-blueprint";
import { EntityBlueprintInstance } from "./entity-blueprint-instance.type";
import {
    BlueprintProperty,
    BlueprintPropertyValue,
    RelationAttribute,
    hasAttribute,
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
            // [todo] make sure properties actually exist & are not optional
            schema.setKey(metadata.key);
        }

        if (metadata.indexes) {
            for (const name in metadata.indexes) {
                const path = metadata.indexes[name];
                schema.addIndex(path, { name });
            }
        }

        const properties = toPropertyRecord(new blueprint() as Record<string, unknown>);
        let foundId = false;

        for (const [name, property] of Object.entries(properties)) {
            if (hasAttribute("id", property)) {
                if (foundId) {
                    throw new Error(
                        `blueprint ${schema.getId()} contains multiple properties with the "id" attribute. If you need a composite id, please define it in the ${
                            EntityBlueprint.name
                        } class decorator instead`
                    );
                }

                foundId = true;
                if (hasAttribute("optional", property)) {
                    throw new Error(`id property ${schema.getId()}.${name} can't be optional`);
                }

                schema.setKey(name);

                if (isPrimitive(property.valueType)) {
                    schema.addProperty(
                        name,
                        new PrimitiveSchema(this.toPrimitiveSchemaDataType(property.valueType)),
                        true
                    );
                } else {
                    throw new Error(`not yet implemented: id attribute on a complex type property`);
                }
            } else if (hasAttribute("relation", property)) {
                this.addRelationPropertyToSchema(schema, name, property, properties);
            } else {
                this.addNonRelationalPropertyToSchema(schema, name, property);
            }

            if (
                !hasAttribute("id", property) &&
                (hasAttribute("index", property) || hasAttribute("unique", property))
            ) {
                schema.addIndex(name, { unique: hasAttribute("unique", property) });
            }
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
        relationProperty: BlueprintProperty & RelationAttribute,
        properties: Record<string, BlueprintProperty>
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

        const from = this.relationPropertyToFromString(relationProperty, properties);
        const to = this.relationPropertyToToString(relationProperty);
        schema.addRelation(name, from, to);
    }

    private relationPropertyToFromString(
        relationProperty: BlueprintProperty & RelationAttribute,
        properties: Record<string, BlueprintProperty>
    ): string | string[] {
        if (
            typeof relationProperty.from === "string" ||
            (Array.isArray(relationProperty.from) && relationProperty.from.every(isString))
        ) {
            return relationProperty.from;
        } else {
            const fromProperties = Array.isArray(relationProperty.from)
                ? relationProperty.from
                : [relationProperty.from];
            return fromProperties.map(fromProperty => this.getNameOfProperty(properties, fromProperty));
        }
    }

    private relationPropertyToToString(relationProperty: BlueprintProperty & RelationAttribute): string | string[] {
        if (
            typeof relationProperty.to === "string" ||
            (Array.isArray(relationProperty.to) && relationProperty.to.every(isString))
        ) {
            return relationProperty.to;
        } else {
            if (!isEntityBlueprint(relationProperty.valueType)) {
                throw new Error(`valueType must be a blueprint`);
            }

            const instance = new relationProperty.valueType();
            const allProperties = toPropertyRecord(instance);
            let providedProperties = relationProperty.to(instance);

            if (!Array.isArray(providedProperties)) {
                providedProperties = [providedProperties];
            }

            return providedProperties.map(toProperty => this.getNameOfProperty(allProperties, toProperty));
        }
    }

    private getNameOfProperty(properties: Record<string, BlueprintProperty>, property: BlueprintProperty): string {
        const name = this.findKeyOfValueInRecord(properties, property);

        if (name === undefined) {
            throw new Error(`did not find name of property`);
        }

        return name;
    }

    private findKeyOfValueInRecord<T>(record: Record<string, T>, value: T): string | undefined {
        const [key] = Object.entries(record).find(([_, candidate]) => candidate === value) ?? [];

        return key;
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

import { Class, isDefined } from "@entity-space/utils";
import "reflect-metadata";
import { BlueprintPropertyValue, Entity, hasAttribute, Instance, isProperty, Property } from "../entity";
import { EntitySchema } from "./entity-schema";
import { ArraySchema, PrimitiveSchema } from "./property-value";
import { PrimitiveSchemaDataType } from "./schema.interface";

const BLUEPRINT_METADATA_KEY = Symbol("blueprint-metadata");

interface BlueprintMetadata {
    id: string;
}

export function Blueprint(args: { id: string }) {
    return (type: Class) => {
        const metadata: BlueprintMetadata = { id: args.id };
        Reflect.defineMetadata(BLUEPRINT_METADATA_KEY, metadata, type);
    };
}

function findBlueprintMetadata(type: Class): BlueprintMetadata | undefined {
    return Reflect.getMetadata(BLUEPRINT_METADATA_KEY, type);
}

function getBlueprintMetadata(type: Class): BlueprintMetadata {
    const metadata = findBlueprintMetadata(type);

    if (!metadata) {
        throw new Error(`no blueprint metadata found for ${type.name}`);
    }

    return metadata;
}

function isBlueprint(value: any): value is Class {
    return Reflect.getMetadata(BLUEPRINT_METADATA_KEY, value) !== void 0;
}

type NamedProperty = Property & { name: string };

function getNamedProperties(blueprint: Class): NamedProperty[] {
    const instance = new blueprint();

    return Object.entries(instance)
        .map(([name, property]) => (isProperty(property) ? { ...property, name } : void 0))
        .filter(isDefined);
}

export class SchemaCatalog {
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

    resolve<T>(blueprint: Class<T>): EntitySchema<Instance<T>> {
        const metadata = getBlueprintMetadata(blueprint);
        let schema = this.schemas.get(metadata.id);

        if (schema) {
            return schema as EntitySchema<Instance<T>>;
        }

        console.log(`🔨 ⏳ building schema ${metadata.id} from blueprint...`);
        schema = new EntitySchema(metadata.id);
        this.schemas.set(metadata.id, schema);
        const properties = getNamedProperties(blueprint);
        const idProperties = properties.filter(hasAttribute("id"));

        if (idProperties.length > 0) {
            schema.setKey(idProperties.map(property => property.name));

            for (const idProperty of idProperties) {
                schema.addProperty(
                    idProperty.name,
                    new PrimitiveSchema(this.toPrimitiveSchemaDataType(idProperty.valueType))
                );
            }
        }
        for (const relationProperty of properties.filter(hasAttribute("relation"))) {
            if (typeof relationProperty.valueType === "object" && "$ref" in relationProperty.valueType) {
                const relatedSchema = this.getSchema(relationProperty.valueType.$ref);

                if (hasAttribute("array", relationProperty)) {
                    schema.addProperty(relationProperty.name, new ArraySchema(relatedSchema));
                } else {
                    schema.addProperty(relationProperty.name, relatedSchema);
                }

                schema.addRelation(relationProperty.name, relationProperty.from, relationProperty.to);
            } else if (isBlueprint(relationProperty.valueType)) {
                const relatedSchema = this.resolve(relationProperty.valueType);

                if (hasAttribute("array", relationProperty)) {
                    schema.addProperty(relationProperty.name, new ArraySchema(relatedSchema));
                } else {
                    schema.addProperty(relationProperty.name, relatedSchema);
                }

                schema.addRelation(relationProperty.name, relationProperty.from, relationProperty.to);
            }

            // [todo] implement remaining relational value types
        }

        for (const indexedProperty of properties.filter(hasAttribute("index"))) {
            schema.addIndex(indexedProperty.name);
        }

        console.log(`🔨 ✔️ built schema ${metadata.id}`, schema);

        return schema as EntitySchema<Instance<T>>;
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

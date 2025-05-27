import { Class, Path, Primitive, toPath, toPaths } from "@entity-space/utils";
import { isString } from "lodash";
import { getEntityBlueprintMetadata, isEntityBlueprint, toPropertyRecord } from "./entity-blueprint";
import {
    BlueprintProperty,
    EntityAttribute,
    hasAttribute,
    IdAttribute,
    toContainerType,
} from "./entity-blueprint-property";
import { RelationshipType } from "./entity-relation-property";
import { EntitySchema } from "./entity-schema";

export class EntitySchemaCatalog {
    readonly #schemas = new Map<string, EntitySchema>();

    getSchema(name: string): EntitySchema {
        const schema = this.#schemas.get(name);

        if (!schema) {
            throw new Error(`schema ${name} doesn't exist`);
        }

        return schema;
    }

    getSchemaByBlueprint(blueprint: Class): EntitySchema {
        const metadata = getEntityBlueprintMetadata(blueprint);

        if (!this.#schemas.has(metadata.name)) {
            this.#addBlueprint(blueprint);
        }

        return this.#schemas.get(metadata.name) as EntitySchema;
    }

    addSchema(schema: EntitySchema): this {
        this.#schemas.set(schema.getName(), schema);
        return this;
    }

    #addBlueprint(blueprint: Class): void {
        const metadata = getEntityBlueprintMetadata(blueprint);
        const schema = new EntitySchema(metadata.name);
        this.#schemas.set(metadata.name, schema);

        if (metadata.sort) {
            schema.setSorter(metadata.sort);
        }

        const properties = toPropertyRecord(new blueprint());
        const ids: Record<string, BlueprintProperty & IdAttribute> = {};
        const primitives: Record<string, BlueprintProperty> = {};
        const entities: Record<string, BlueprintProperty & EntityAttribute> = {};
        const joinedEntities: Record<string, BlueprintProperty & EntityAttribute> = {};

        for (const [name, property] of Object.entries(properties)) {
            if (hasAttribute("entity", property)) {
                if (property.relationshipType === RelationshipType.Joined) {
                    joinedEntities[name] = property;
                } else {
                    entities[name] = property;
                }
            } else {
                primitives[name] = property;
            }

            if (hasAttribute("id", property)) {
                ids[name] = property;
            }
        }

        const isCompositeId = Object.keys(ids).length > 1;

        for (const [name, property] of Object.entries(primitives)) {
            schema.addPrimitive(name, property.valueType as Primitive, {
                container: toContainerType(property),
                creatable: hasAttribute("creatable", property),
                dtoName: hasAttribute("dto", property) ? property.dto : undefined,
                nullable: hasAttribute("nullable", property),
                optional: hasAttribute("optional", property),
                readonly: hasAttribute("readonly", property),
                unique: hasAttribute("id", property) && !isCompositeId ? true : hasAttribute("unique", property),
            });
        }

        if (Object.keys(ids).length) {
            schema.setId(toPaths(Object.keys(ids)));
        }

        for (const [name, property] of Object.entries(entities)) {
            if (!isEntityBlueprint(property.valueType)) {
                throw new Error(`valueType of property ${name} is not a blueprint`);
            }

            const relatedSchema = this.getSchemaByBlueprint(property.valueType);

            schema.addRelation(name, relatedSchema, {
                relationshipType: property.relationshipType,
                container: toContainerType(property),
                dtoName: hasAttribute("dto", property) ? property.dto : undefined,
                nullable: hasAttribute("nullable", property),
                optional: hasAttribute("optional", property),
                readonly: hasAttribute("readonly", property),
            });
        }

        for (const [name, property] of Object.entries(joinedEntities)) {
            if (!isEntityBlueprint(property.valueType)) {
                throw new Error(`valueType of property ${name} is not a blueprint`);
            }

            const relatedSchema = this.getSchemaByBlueprint(property.valueType);

            schema.addRelation(name, relatedSchema, {
                relationshipType: property.relationshipType,
                container: toContainerType(property),
                dtoName: hasAttribute("dto", property) ? property.dto : undefined,
                joinFrom: this.#toJoinFromPath(property, properties),
                joinTo: this.#toJoinToPath(property),
                nullable: hasAttribute("nullable", property),
                optional: hasAttribute("optional", property),
            });
        }
    }

    #toJoinFromPath(
        property: BlueprintProperty & EntityAttribute,
        properties: Record<string, BlueprintProperty>,
    ): Path[] {
        if (isString(property.from)) {
            return [toPath(property.from)];
        } else if (Array.isArray(property.from) && property.from.every(isString)) {
            return toPaths(property.from);
        } else {
            const fromProperties = Array.isArray(property.from) ? property.from : [property.from];
            return toPaths(fromProperties.map(fromProperty => this.#getNameOfProperty(properties, fromProperty)));
        }
    }

    #toJoinToPath(property: BlueprintProperty & EntityAttribute): Path[] {
        if (isString(property.to)) {
            return [toPath(property.to)];
        } else if (Array.isArray(property.to) && property.to.every(isString)) {
            return toPaths(property.to);
        } else {
            if (!isEntityBlueprint(property.valueType)) {
                throw new Error(`valueType must be a blueprint`);
            }

            const instance = new property.valueType();
            const allProperties = toPropertyRecord(instance);
            let providedProperties = property.to(instance);

            if (!Array.isArray(providedProperties)) {
                providedProperties = [providedProperties];
            }

            return toPaths(providedProperties.map(toProperty => this.#getNameOfProperty(allProperties, toProperty)));
        }
    }

    #getNameOfProperty(properties: Record<string, BlueprintProperty>, property: BlueprintProperty): string {
        const name = Object.entries(properties).find(([_, candidate]) => candidate === property)?.[0];

        if (name === undefined) {
            throw new Error(`did not find name of property`);
        }

        return name;
    }
}

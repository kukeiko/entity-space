import {
    Class,
    EnumPrimitive,
    enumToPrimitive,
    isNotNullsy,
    isPrimitiveType,
    Path,
    toPath,
    toPaths,
} from "@entity-space/utils";
import { isString } from "lodash";
import { unpackSelectionWithoutDefault } from "../selection/unpack-selection-without-default.fn";
import {
    EntityBlueprintMetadata,
    getAllEntityBlueprintMetadata,
    isEntityBlueprint,
    toPropertyRecord,
} from "./blueprint/entity-blueprint";
import {
    BlueprintProperty,
    EntityAttribute,
    hasAttribute,
    IdAttribute,
    toContainerType,
} from "./blueprint/entity-blueprint-property";
import { ConcreteEntitySchema } from "./schema/concrete-entity-schema";
import { EntityComputedProperties } from "./schema/entity-computed-properties";
import { EntityPrimitiveProperty } from "./schema/entity-primitive-property";
import { ContainerType } from "./schema/entity-property";
import { EntityRelationProperty, RelationshipType } from "./schema/entity-relation-property";
import { EntitySchema } from "./schema/entity-schema";

function getUnionIdPaths(schemas: readonly EntitySchema[]): readonly Path[] {
    const [first, ...others] = schemas;
    const idPaths = first.getIdPaths();
    const idPathsHash = idPaths.join(":");

    if (!others.every(schema => schema.getIdPaths().join(":") === idPathsHash)) {
        throw new Error(`id paths across all schemas in a union must be equal`);
    }

    return idPaths;
}

function assertIsEqualPrimitive(a: EntityPrimitiveProperty, b: EntityPrimitiveProperty): void {
    // [todo] ❌ add equality checking
    // throw new Error(`primitive "${a.getName()}" is not equal across all schemas in the union`);
}

function getUnionPrimitives(schemas: readonly EntitySchema[]): Record<string, EntityPrimitiveProperty> {
    const primitives: Record<string, EntityPrimitiveProperty> = {};

    for (const schema of schemas) {
        for (const primitive of schema.getPrimitives()) {
            if (primitive.isDiscriminator()) {
                continue;
            }

            // [todo] ❌ figure out what to do with the discriminators, as they are different for each concrete schema.
            // we could create an enumeration property?
            const existing = primitives[primitive.getName()];

            if (existing === undefined) {
                primitives[primitive.getName()] = primitive;
            } else {
                assertIsEqualPrimitive(existing, primitive);
            }
        }
    }

    return primitives;
}

function getUnionDiscriminator(schemas: readonly ConcreteEntitySchema[]): [string, EnumPrimitive<any>] {
    const enumPrimitive = enumToPrimitive(
        Object.fromEntries(
            schemas.map(schema => {
                const value = schema.getDiscriminator().getDefaultValue();
                return [value, value];
            }),
        ),
    );

    const name = schemas[0].getDiscriminator().getName();

    return [name, enumPrimitive];
}

function assertIsEqualRelation(a: EntityRelationProperty, b: EntityRelationProperty): void {
    // [todo] ❌ add equality checking
    // throw new Error(`relation "${a.getName()}" is not equal across all schemas in the union`);
}

function getUnionRelations(schemas: readonly EntitySchema[]): Record<string, EntityRelationProperty> {
    const relations: Record<string, EntityRelationProperty> = {};

    for (const schema of schemas) {
        for (const relation of schema.getRelations()) {
            const existing = relations[relation.getName()];

            if (existing === undefined) {
                relations[relation.getName()] = relation;
            } else {
                assertIsEqualRelation(existing, relation);
            }
        }
    }

    return relations;
}

export class EntitySchemaBuilder {
    #blueprintMetadata = new Map<Class | Class[], EntityBlueprintMetadata>();
    readonly #schemas = new Map<Class | Class[], ConcreteEntitySchema>();

    addFromRegisteredBlueprints(): void {
        this.#blueprintMetadata = getAllEntityBlueprintMetadata();
    }

    build(): Map<Class | Class[], ConcreteEntitySchema> {
        this.#createEmptySchemas();
        this.#buildConcreteSchemaPrimitives();
        this.#buildUnionSchemaPrimitives();
        this.#buildConcreteSchemaRelations();
        this.#buildUnionSchemaRelations();
        this.#buildComputed();

        return new Map(this.#schemas.entries());
    }

    #createEmptySchemas(): void {
        // create concrete schemas first so union schemas can refer to them in the next step
        for (const [blueprint, metadata] of this.#blueprintMetadata) {
            if (Array.isArray(blueprint)) {
                continue;
            }

            const schema = new ConcreteEntitySchema(metadata.name ?? blueprint.name, metadata.sort);
            this.#schemas.set(blueprint, schema);
        }

        // create union schemas referring to the just created concrete schemas
        for (const [blueprints, metadata] of this.#blueprintMetadata) {
            if (!Array.isArray(blueprints)) {
                continue;
            }

            const schemas = blueprints.map(blueprint => this.#schemas.get(blueprint));

            if (!schemas.every(isNotNullsy)) {
                throw new Error("a union schema contains blueprints that don't exist");
            }

            const name = metadata.name ?? schemas.map(schema => schema.getName()).join(",");
            const schema = new ConcreteEntitySchema(name, metadata.sort);
            schema.setSchemas(schemas);
            this.#schemas.set(blueprints, schema);
        }
    }

    #buildConcreteSchemaPrimitives(): void {
        for (const [blueprint, schema] of this.#schemas) {
            if (Array.isArray(blueprint)) {
                continue;
            }

            const properties = toPropertyRecord(new blueprint());
            const ids: Record<string, BlueprintProperty & IdAttribute> = {};
            const primitives: Record<string, BlueprintProperty> = {};

            for (const [name, property] of Object.entries(properties)) {
                if (hasAttribute("entity", property)) {
                    continue;
                } else {
                    primitives[name] = property;
                }

                if (hasAttribute("id", property)) {
                    ids[name] = property;
                }
            }

            const isCompositeId = Object.keys(ids).length > 1;

            for (const [name, property] of Object.entries(primitives)) {
                if (!isPrimitiveType(property.valueType)) {
                    throw new Error(`expected valueType of property ${schema}.${name} to be a primitive`);
                }

                schema.addPrimitive(name, property.valueType, {
                    container: toContainerType(property),
                    creatable: hasAttribute("creatable", property) || !hasAttribute("readonly", property),
                    dtoName: hasAttribute("dto", property) ? property.dto : undefined,
                    nullable: hasAttribute("nullable", property),
                    optional: hasAttribute("optional", property),
                    readonly: hasAttribute("readonly", property),
                    unique: hasAttribute("id", property) && !isCompositeId ? true : hasAttribute("unique", property),
                    discriminator: hasAttribute("discriminator", property),
                });
            }

            if (Object.keys(ids).length) {
                schema.setId(toPaths(Object.keys(ids)));
            }
        }
    }

    #buildUnionSchemaPrimitives(): void {
        for (const [blueprint, schema] of this.#schemas) {
            if (!Array.isArray(blueprint)) {
                continue;
            }

            const schemas = schema.getSchemas();
            const primitives = getUnionPrimitives(schemas);

            for (const [name, primitive] of Object.entries(primitives)) {
                schema.addPrimitive(name, primitive.getPrimitiveType(), {
                    container: primitive.isContainer() ? ContainerType.Array : undefined,
                    creatable: primitive.isCreatable(),
                    dtoName: primitive.getDtoName(),
                    nullable: primitive.isNullable(),
                    optional: primitive.isOptional(),
                    readonly: primitive.isReadonly(),
                    unique: primitive.isUnique(),
                    // [todo] ❌ figure out what to do with the discriminators, as they are different for each concrete schema.
                    // maybe we could create an enumeration property?
                    // discriminator:  hasAttribute("discriminator", property),
                });
            }

            const [discriminatorName, discriminatorPrimitive] = getUnionDiscriminator(schemas);
            schema.addPrimitive(discriminatorName, discriminatorPrimitive, { discriminator: true });
            schema.setId(getUnionIdPaths(schemas));
        }
    }

    #buildConcreteSchemaRelations(): void {
        for (const [blueprint, schema] of this.#schemas) {
            if (Array.isArray(blueprint)) {
                continue;
            }

            const properties = toPropertyRecord(new blueprint());
            const embeddedEntities: Record<string, BlueprintProperty & EntityAttribute> = {};
            const joinedEntities: Record<string, BlueprintProperty & EntityAttribute> = {};

            for (const [name, property] of Object.entries(properties)) {
                if (!hasAttribute("entity", property)) {
                    continue;
                }

                if (property.relationshipType === RelationshipType.Joined) {
                    joinedEntities[name] = property;
                } else {
                    embeddedEntities[name] = property;
                }
            }

            for (const [name, property] of Object.entries(embeddedEntities)) {
                if (!isEntityBlueprint(property.valueType)) {
                    throw new Error(`valueType of property ${name} is not a blueprint`);
                }

                const relatedSchema = this.#schemas.get(property.valueType);

                if (relatedSchema === undefined) {
                    throw new Error("related schema not found");
                }

                schema.addRelation(name, relatedSchema, {
                    relationshipType: property.relationshipType,
                    container: toContainerType(property),
                    dtoName: hasAttribute("dto", property) ? property.dto : undefined,
                    nullable: hasAttribute("nullable", property),
                    optional: hasAttribute("optional", property),
                    readonly: hasAttribute("readonly", property),
                    creatable: hasAttribute("creatable", property) || !hasAttribute("readonly", property),
                });
            }

            for (const [name, property] of Object.entries(joinedEntities)) {
                if (!isEntityBlueprint(property.valueType)) {
                    throw new Error(`valueType of property ${name} is not a blueprint`);
                }

                const relatedSchema = this.#schemas.get(property.valueType);

                if (relatedSchema === undefined) {
                    throw new Error("related schema not found");
                }

                schema.addRelation(name, relatedSchema, {
                    relationshipType: property.relationshipType,
                    container: toContainerType(property),
                    dtoName: hasAttribute("dto", property) ? property.dto : undefined,
                    joinFrom: this.#toJoinFromPath(property, properties),
                    joinTo: this.#toJoinToPath(property),
                    nullable: hasAttribute("nullable", property),
                    optional: hasAttribute("optional", property),
                    outbound:
                        hasAttribute("outbound", property) || (hasAttribute("inbound", property) ? false : undefined),
                });
            }
        }
    }

    #buildUnionSchemaRelations(): void {
        for (const [blueprint, schema] of this.#schemas) {
            if (!Array.isArray(blueprint)) {
                continue;
            }

            const schemas = schema.getSchemas();
            const relations = getUnionRelations(schemas);
            schema.setId(getUnionIdPaths(schemas));

            for (const [name, relation] of Object.entries(relations)) {
                const relatedSchema = relation.getRelatedSchema();

                if (relation.isEmbedded()) {
                    schema.addRelation(name, relatedSchema, {
                        container: relation.isArray() ? ContainerType.Array : undefined,
                        dtoName: relation.getDtoName(),
                        nullable: relation.isNullable(),
                        optional: relation.isOptional(),
                        readonly: relation.isReadonly(),
                        creatable: relation.isCreatable(),
                    });
                } else {
                    schema.addRelation(name, relatedSchema, {
                        relationshipType: RelationshipType.Joined,
                        container: relation.isArray() ? ContainerType.Array : undefined,
                        dtoName: relation.getDtoName(),
                        joinFrom: relation.getJoinFrom(),
                        joinTo: relation.getJoinTo(),
                        nullable: relation.isNullable(),
                        optional: relation.isOptional(),
                        outbound: relation.isOutbound(),
                    });
                }
            }
        }
    }

    #buildComputed(): void {
        for (const [blueprint, metadata] of this.#blueprintMetadata) {
            for (const computed of metadata.computed) {
                const schema = this.#schemas.get(blueprint);

                if (!schema) {
                    throw new Error("bad library");
                }

                const selection = unpackSelectionWithoutDefault(schema, computed.select);
                const requires = unpackSelectionWithoutDefault(schema, computed.requires ?? {});
                const computedProperties = new EntityComputedProperties(selection, requires, computed.compute);
                schema.addComputedProperties(computedProperties);
            }
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

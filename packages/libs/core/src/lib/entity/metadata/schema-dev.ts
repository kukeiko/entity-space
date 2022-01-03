import { Schema, SchemaProperty } from "./schema";
import { SchemaCatalog } from "./schema-catalog";
import {
    EntitySpaceSchema,
    EntitySpaceSchemaIndex,
    EntitySpaceSchemaRelation,
    OpenApiDiscriminator,
    OpenApiSchema,
    OpenApiSchemaProperty,
} from "./schema-json";
import { SchemaIndexV1 } from "./schema-v1-index";

function buildDefaultIndexName(path: string[]): string {
    return path.join(",");
}

export class SchemaDev implements Schema {
    constructor(name: string, json: EntitySpaceSchema, catalog: SchemaCatalog) {
        this.name = name;
        this.json = json;
        this.catalog = catalog;
    }

    getPropertyByPath(path: string): SchemaProperty {
        if (path.includes(".")) {
            throw new Error("path not implemented yet");
        }

        return this.getProperty(path);
    }

    protected readonly name: string;
    protected readonly json: EntitySpaceSchema;
    protected readonly catalog: SchemaCatalog;

    getSchemaName(): string {
        return this.name;
    }

    hasKey(): boolean {
        return this.json.key !== void 0;
    }

    getType(): string {
        return this.json.type;
    }

    isUnion(): boolean {
        return (
            (this.json.allOf ?? []).length === 0 &&
            (this.json.anyOf ?? []).length === 0 &&
            (this.json.oneOf ?? []).length > 0 &&
            Object.keys(this.json.properties ?? {}).length === 0
        );
    }

    getRelations(): EntitySpaceSchemaRelation[] {
        return this.json.relations ?? [];
    }

    getAllOf(): Schema[] {
        const allOf = this.json.allOf ?? [];
        const schemas: Schema[] = [];

        for (let parentSchemaJson of allOf) {
            let parentSchema: Schema;

            if ("$ref" in parentSchemaJson) {
                parentSchema = this.catalog.getSchema(parentSchemaJson.$ref);
            } else {
                throw new Error(`only inline-schemas are currently supported in allOf`);
            }

            schemas.push(parentSchema, ...parentSchema.getAllOf());
        }

        return schemas;
    }

    getOneOf(): Schema[] {
        const schemas: Schema[] = [];
        const oneOf = this.json.oneOf ?? [];

        for (const schemaJson of oneOf) {
            let schema: Schema;

            if ("$ref" in schemaJson) {
                schema = this.catalog.getSchema(schemaJson.$ref);
            } else {
                throw new Error(`only inline-schemas are currently supported in oneOf`);
            }

            schemas.push(schema);
        }

        return schemas;
    }

    getUnionDiscriminator(): OpenApiDiscriminator | undefined {
        if (!this.isUnion()) {
            throw new Error(`schema is not a union`);
        }

        const discriminators = new Map<string, OpenApiDiscriminator>();

        // [todo] flatten unions - that is, schemas in oneOf() that themselves are unions might exist
        // and are not yet considered properly.
        for (const schema of this.getOneOf()) {
            if (discriminators.size === 0) {
                for (const item of schema.getDiscriminators()) {
                    discriminators.set(item.propertyName, item);
                }
            } else {
                const matches = schema
                    .getDiscriminators()
                    .filter(discriminator => discriminators.has(discriminator.propertyName));

                if (matches.length === 0) {
                    throw new Error(`no matching discriminator between the unioned schemas`);
                }

                discriminators.clear();

                for (const match of matches) {
                    discriminators.set(match.propertyName, match);
                }
            }
        }

        return discriminators.values().next().value;
    }

    getDiscriminators(): OpenApiDiscriminator[] {
        const discriminators: OpenApiDiscriminator[] = [];

        if (this.json.discriminator !== void 0) {
            discriminators.push(this.json.discriminator);
        }

        const parentSchemas = this.getAllOf();

        for (const parentSchema of parentSchemas) {
            discriminators.push(...parentSchema.getDiscriminators());
        }

        return discriminators;
    }

    getProperty(name: string): SchemaProperty {
        const property = this.getProperties().find(property => property.getPropertyName() === name);

        if (property === void 0) {
            throw new Error(`schema for model ${this.name} does not have a property named ${name}`);
        }

        return property;
    }

    getProperties(): readonly SchemaProperty[] {
        const properties: SchemaProperty[] = [];
        const parentSchemas = this.getAllOf();

        for (const parentSchema of parentSchemas) {
            properties.push(...parentSchema.getProperties());
        }

        const ownProperties = this.json.properties ?? {};

        for (const key in ownProperties) {
            const propertyJson = ownProperties[key];
            let property: SchemaProperty;

            if ("$ref" in propertyJson) {
                const propertySchemaJson = this.catalog.getSchemaJson(propertyJson.$ref);
                property = new SchemaDevProperty(this, key, propertySchemaJson, this.catalog);
            } else {
                property = new SchemaDevProperty(this, key, propertyJson, this.catalog);
            }

            properties.push(property);
        }

        return properties;
    }

    getIndex(name: string): SchemaIndexV1 {
        // [todo] i don't want a linear lookup here as it's on the critical path
        const index = this.getIndexes().find(index => index.name === name);

        if (index === void 0) {
            if (this.hasKey() && this.getKeyIndex().name === name) {
                return this.getKeyIndex();
            }

            throw new Error(`index ${name} not found on schema ${this.name}`);
        }

        return index;
    }

    getAllIndexes(): readonly SchemaIndexV1[] {
        const indexes = this.getIndexes().slice();

        if (this.json.key) {
            const key = Array.isArray(this.json.key) ? this.json.key : [this.json.key];
            const keyIndex = new SchemaIndexV1(buildDefaultIndexName(key), key, { unique: true });
            indexes.push(keyIndex);
        }

        return indexes;
    }

    getKeyIndex(): SchemaIndexV1 {
        if (this.json.key === void 0) {
            throw new Error(`no key defined on schema ${this.name}`);
        }

        const key = Array.isArray(this.json.key) ? this.json.key : [this.json.key];
        return new SchemaIndexV1(buildDefaultIndexName(key), key, { unique: true });
    }

    // [todo] include those from allOf()
    getIndexes(): readonly SchemaIndexV1[] {
        const indexes: SchemaIndexV1[] = [];
        const indexesJson = this.json.indexes ?? {};

        for (const indexName in indexesJson) {
            const indexJson = indexesJson[indexName];
            const index = new SchemaIndexV1(indexName, indexJson.path, { unique: indexJson.unique });
            indexes.push(index);
        }

        return indexes;
    }
}

export class SchemaDevProperty extends SchemaDev implements SchemaProperty {
    constructor(owner: Schema, name: string, json: OpenApiSchemaProperty, catalog: SchemaCatalog) {
        super(name, json, catalog);
        this.owner = owner;
        this.json = json;
    }

    private readonly owner: Schema;
    protected readonly json: OpenApiSchemaProperty;

    getPropertyName(): string {
        return this.name;
    }

    isNavigable(): boolean {
        return SchemaDevProperty.isNavigable(this);
    }

    static isNavigable(property: SchemaDevProperty): boolean {
        return property.getType() === "object";
    }
}

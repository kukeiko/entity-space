import { DerivedSchemaPropertyKey } from "./derived-schema-property-key";
import { EntitySpaceSchemaRelation_Old, EntitySpaceSchema } from "./entity-space-schema";
import { isJsonSchemaReference, OpenApiDiscriminator } from "./open-api-schema";
import { Schema, SchemaProperty } from "./schema";
import { SchemaCatalog_Interface } from "./schema-catalog";
import { SchemaIndexV1 } from "./schema-v1-index";

function buildDefaultIndexName(path: string | string[]): string {
    return Array.isArray(path) ? path.join(",") : path;
}

// [todo] enhance error messages with more details to make it easier to find erroneous schema
export abstract class UnbakedSchemaBase implements Schema {
    constructor(schema: EntitySpaceSchema, catalog: SchemaCatalog_Interface) {
        this.schema = schema;
        this.catalog = catalog;
    }

    protected readonly schema: EntitySpaceSchema;
    protected readonly catalog: SchemaCatalog_Interface;

    protected getDerivedSchemas(key: DerivedSchemaPropertyKey): Schema[] {
        const definitions = this.schema[key];

        if (definitions === void 0) {
            return [];
        }

        const schemas: Schema[] = [];

        for (const definition of definitions) {
            let $id: string;

            if (isJsonSchemaReference(definition)) {
                $id = definition.$ref;
            } else if (definition.$id !== void 0) {
                $id = definition.$id;
            } else {
                throw new Error(`property $id is missing in derived schema`);
            }

            schemas.push(this.catalog.getSchema($id));
        }

        return schemas;
    }

    getAllOf(): Schema[] {
        return this.getDerivedSchemas("allOf");
    }

    // [todo] add to Schema interface
    getAnyOf(): Schema[] {
        return this.getDerivedSchemas("anyOf");
    }

    // [todo] add to Schema interface
    getOneOf(): Schema[] {
        return this.getDerivedSchemas("oneOf");
    }

    getDiscriminators(): OpenApiDiscriminator[] {
        const discriminators: OpenApiDiscriminator[] = [];

        if (this.schema.discriminator !== void 0) {
            discriminators.push(this.schema.discriminator);
        }

        const parentSchemas = this.getAllOf();

        for (const parentSchema of parentSchemas) {
            discriminators.push(...parentSchema.getDiscriminators());
        }

        return discriminators;
    }

    getIndex(name: string): SchemaIndexV1 {
        const index = this.getIndexes().find(index => index.name === name);

        if (index === void 0) {
            // [todo] not sure i want this
            if (this.hasKey() && this.getKeyIndex().name === name) {
                return this.getKeyIndex();
            }

            // [todo] dirty dirty
            const nominalSchema = this.getNominalSchema();

            if (nominalSchema !== this) {
                if (nominalSchema.hasKey() && nominalSchema.getKeyIndex().name === name) {
                    return nominalSchema.getKeyIndex();
                }
            }

            throw new Error(`index ${name} not found on schema ${this.getSchemaId()}`);
        }

        return index;
    }

    getAllIndexes(): readonly SchemaIndexV1[] {
        let indexes = this.getIndexes();

        if (this.hasKey()) {
            indexes = [...indexes, this.getKeyIndex()];
        }

        return indexes;
    }

    // [todo] i feel like this should behave like getAllIndexes().
    // need to check out how it is used already and go from there.
    getIndexes(): readonly SchemaIndexV1[] {
        const indexDefinitions = this.schema.indexes ?? {};
        const indexes: SchemaIndexV1[] = this.getAllOf()
            .map(schema => schema.getIndexes().slice())
            .reduce((acc, value) => [...acc, ...value], []);

        for (const key in indexDefinitions) {
            const indexDefinition = indexDefinitions[key];

            let path: string | string[];
            const name = key;
            let unique = false;
            let multiEntry = false;

            if (typeof indexDefinition === "string" || Array.isArray(indexDefinition)) {
                path = indexDefinition;
            } else if (indexDefinition === true) {
                path = key;
            } else {
                path = indexDefinition.path ?? key;
                unique = indexDefinition.unique ?? unique;
                multiEntry = indexDefinition.multiEntry ?? multiEntry;
            }

            // [todo] multiEntry option doesn't exist yet
            const index = new SchemaIndexV1(name, path, { unique });
            indexes.push(index);
        }

        return indexes;
    }

    getProperties(): readonly SchemaProperty[] {
        const propertyDefinitions = this.schema.properties ?? {};
        const properties: SchemaProperty[] = [];

        for (const key in propertyDefinitions) {
            const propertyDefinition = propertyDefinitions[key];
            let property$Id: string;
            if (isJsonSchemaReference(propertyDefinition)) {
                property$Id = propertyDefinition.$ref;
            } else if (propertyDefinition.$id !== void 0) {
                property$Id = propertyDefinition.$id;
            } else {
                throw new Error(`$id is missing in schema property`);
            }

            const property = this.catalog.getSchemaProperty(property$Id);
            properties.push(property);
        }

        return properties;
    }

    getProperty(name: string): SchemaProperty {
        // [todo] a bit dirty?
        const propertySchemaId = `${this.getSchemaId()}/properties/${name}`;

        return this.catalog.getSchemaProperty(propertySchemaId);
    }

    getPropertyByPath(path: string): SchemaProperty {
        if (path.includes(".")) {
            throw new Error("path not implemented yet");
        }

        return this.getProperty(path);
    }

    getRelations(): EntitySpaceSchemaRelation_Old[] {
        const relationDefintions = this.schema.relations ?? {};
        const relations: EntitySpaceSchemaRelation_Old[] = [];

        for (const key in relationDefintions) {
            const relationDefintion = relationDefintions[key];
            const path = key;
            let from: string;
            let to: string;

            if (Array.isArray(relationDefintion)) {
                // [todo] unchecked index access and no errors? should consider enabling that in tsconfig
                from = relationDefintion[0];
                to = relationDefintion[1];
            } else {
                from = relationDefintion.from;
                to = relationDefintion.to;
            }

            relations.push({ path, from, to });
        }

        return relations;
    }

    // [todo] remove in favor of getSchemaId()
    getSchemaName(): string {
        return this.getSchemaId();
    }

    getType(): string {
        const type = this.schema.type;

        if (type === void 0) {
            throw new Error(`type missing in schema`);
        }

        return type;
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

    isUnion(): boolean {
        return (
            (this.schema.allOf ?? []).length === 0 &&
            (this.schema.anyOf ?? []).length === 0 &&
            (this.schema.oneOf ?? []).length > 0 &&
            Object.keys(this.schema.properties ?? {}).length === 0
        );
    }

    hasKey(): boolean {
        return this.schema.key !== void 0;
    }

    getKeyIndex(): SchemaIndexV1 {
        if (this.schema.key === void 0) {
            throw new Error(`schema has no key`);
        }

        let path: string | string[];
        let name: string;

        if (typeof this.schema.key === "string" || Array.isArray(this.schema.key)) {
            name = buildDefaultIndexName(this.schema.key);
            path = this.schema.key;
        } else {
            path = this.schema.key.path;
            name = this.schema.key.name ?? buildDefaultIndexName(path);
        }

        return new SchemaIndexV1(name, path, { unique: true });
    }

    getSchemaId(): string {
        const $id = this.schema.$id;

        if ($id === void 0) {
            throw new Error(`$id missing in schema`);
        }

        return $id;
    }

    // [todo] remove from here & Schema interface? i think it's only relevant for SchemaProperty
    getNominalSchemaId(): string {
        return this.getNominalSchema().getSchemaId();
    }

    // [todo] remove from here & Schema interface? i think it's only relevant for SchemaProperty
    getNominalSchema(): Schema {
        return this;
    }
}

import { SchemaV1 } from "./schema-v1";
import { EntitySpaceSchema, OpenApiSchema } from "./schema-json";
import { SchemaDev } from "./schema-dev";
import { Schema } from "./schema";

export class SchemaCatalog {
    constructor(schemas: SchemaV1[], schemaJsons: Record<string, OpenApiSchema> = {}) {
        for (const schema of schemas) {
            this.schemasV1.set(schema.name, schema);
        }

        for (const schemaName in schemaJsons) {
            this.schemaJsons.set(schemaName, schemaJsons[schemaName]);
        }
    }

    private readonly schemasV1 = new Map<string, SchemaV1>();
    private readonly schemaJsons = new Map<string, OpenApiSchema>();

    getSchemaV1(name: string): SchemaV1 {
        const schema = this.schemasV1.get(name);

        if (schema === void 0) {
            throw new Error(`schema not found: ${name}`);
        }

        return schema;
    }

    getSchema(name: string): Schema {
        const schema = this.schemasV1.get(name);

        if (schema === void 0) {
            const schemaJson = this.schemaJsons.get(name);

            if (schemaJson === void 0) {
                throw new Error(`schema not found: ${name}`);
            }

            return new SchemaDev(name, schemaJson, this);
        }

        return schema;
    }

    getSchemaJson(name: string): EntitySpaceSchema {
        const schemaJson = this.schemaJsons.get(name);

        if (schemaJson === void 0) {
            throw new Error(`schema not found: ${name}`);
        }

        return schemaJson;
    }

    getSchemas(): SchemaV1[] {
        return Array.from(this.schemasV1.values());
    }
}

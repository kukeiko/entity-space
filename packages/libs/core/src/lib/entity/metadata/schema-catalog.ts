import { SchemaV1 } from "./schema-v1";

export class SchemaCatalog {
    constructor(schemas: SchemaV1[]) {
        for (const schema of schemas) {
            this.schemas.set(schema.name, schema);
        }
    }

    private readonly schemas = new Map<string, SchemaV1>();

    getSchema(name: string): SchemaV1 {
        const schema = this.schemas.get(name);

        if (schema === void 0) {
            throw new Error(`schema not found: ${name}`);
        }

        return schema;
    }

    getSchemas(): SchemaV1[] {
        return Array.from(this.schemas.values());
    }
}

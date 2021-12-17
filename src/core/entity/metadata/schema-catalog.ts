import { Schema } from "./schema";

export class SchemaCatalog {
    constructor(schemas: Schema[]) {
        for (const schema of schemas) {
            this.schemas.set(schema.name, schema);
        }
    }

    private readonly schemas = new Map<string, Schema>();

    getSchema(name: string): Schema {
        const schema = this.schemas.get(name);

        if (schema === void 0) {
            throw new Error(`schema not found: ${name}`);
        }

        return schema;
    }

    getSchemas(): Schema[] {
        return Array.from(this.schemas.values());
    }
}

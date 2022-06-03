import { IEntitySchema } from "./schema.interface";

export class SchemaCatalog {
    private readonly schemas = new Map<string, IEntitySchema>();

    addSchema(schema: IEntitySchema): this {
        this.schemas.set(schema.getId(), schema);
        return this;
    }

    getSchema(id: string): IEntitySchema {
        const schema = this.schemas.get(id);

        if (!schema) {
            throw new Error(`schema ${id} not found`);
        }

        return schema;
    }
}

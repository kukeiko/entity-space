import { Entity } from "../entity";
import { IEntitySchema } from "./schema.interface";

export class SchemaCatalog {
    private readonly schemas = new Map<string, IEntitySchema>();

    addSchema(schema: IEntitySchema): this {
        this.schemas.set(schema.getId(), schema);
        return this;
    }

    getSchema<T = Entity>(id: string): IEntitySchema<T> {
        const schema = this.schemas.get(id);

        if (!schema) {
            throw new Error(`schema ${id} not found`);
        }

        return schema as IEntitySchema<T>;
    }
}

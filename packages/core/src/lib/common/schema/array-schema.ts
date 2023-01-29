import { IArraySchema, IEntitySchema, IPrimitiveSchema } from "./schema.interface";

export class ArraySchema implements IArraySchema {
    constructor(itemSchema: IEntitySchema | IPrimitiveSchema) {
        this.itemSchema = itemSchema;
    }

    private readonly itemSchema: IEntitySchema | IPrimitiveSchema;

    readonly schemaType = "array";

    getItemSchema(): IEntitySchema | IPrimitiveSchema {
        return this.itemSchema;
    }
}

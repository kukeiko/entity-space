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

    isArray(): this is IArraySchema {
        return true;
    }

    isEntity(): this is IEntitySchema {
        return false;
    }

    isPrimitive(): this is IPrimitiveSchema {
        return false;
    }

    isNullable(): boolean {
        return false;
    }
}

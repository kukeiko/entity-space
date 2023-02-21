import { IArraySchema, IDictionarySchema, IEntitySchema, IPrimitiveSchema } from "./schema.interface";

export class ArraySchema implements IArraySchema {
    constructor(itemSchema: IEntitySchema | IPrimitiveSchema) {
        this.itemSchema = itemSchema;
    }

    private readonly itemSchema: IEntitySchema | IPrimitiveSchema;

    getItemSchema(): IEntitySchema | IPrimitiveSchema {
        return this.itemSchema;
    }

    isArray(): this is IArraySchema {
        return true;
    }

    isDictionary(): this is IDictionarySchema {
        return false;
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

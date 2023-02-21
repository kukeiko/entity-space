import {
    IArraySchema,
    IDictionarySchema,
    IEntitySchema,
    IPrimitiveSchema,
    PrimitiveSchemaDataType,
} from "./schema.interface";

export class PrimitiveSchema implements IPrimitiveSchema {
    constructor(dataType: PrimitiveSchemaDataType) {
        this.dataType = dataType;
    }

    private readonly dataType: PrimitiveSchemaDataType;

    getDataType(): PrimitiveSchemaDataType {
        return this.dataType;
    }

    isArray(): this is IArraySchema {
        return false;
    }

    isDictionary(): this is IDictionarySchema {
        return false;
    }

    isEntity(): this is IEntitySchema {
        return false;
    }

    isPrimitive(): this is IPrimitiveSchema {
        return true;
    }

    isNullable(): boolean {
        return false;
    }

    supportsValue(value: unknown): boolean {
        const dataType = this.getDataType();

        switch (typeof value) {
            case "boolean":
                return dataType === "boolean";

            case "number":
                return value % 1 === 0 ? dataType === "number" || dataType === "integer" : dataType === "number";

            case "string":
                return dataType === "string";

            default:
                return false;
        }
    }
}

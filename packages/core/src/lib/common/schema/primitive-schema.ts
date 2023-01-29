import { IPrimitiveSchema, PrimitiveSchemaDataType } from "./schema.interface";

export class PrimitiveSchema implements IPrimitiveSchema {
    constructor(dataType: PrimitiveSchemaDataType) {
        this.dataType = dataType;
    }

    private readonly dataType: PrimitiveSchemaDataType;
    readonly schemaType = "primitive";

    getDataType(): PrimitiveSchemaDataType {
        return this.dataType;
    }
}

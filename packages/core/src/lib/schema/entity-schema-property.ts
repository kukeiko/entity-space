import { IEntitySchema, IEntitySchemaProperty, IPrimitiveSchema, PropertyValueSchema } from "./schema.interface";

export class EntitySchemaProperty implements IEntitySchemaProperty {
    constructor(entitySchema: IEntitySchema, name: string, valueSchema: PropertyValueSchema) {
        this.name = name;
        this.valueSchema = valueSchema;
        this.entitySchema = entitySchema;
    }

    private readOnly = false;
    private writeOnly = false;

    private readonly entitySchema: IEntitySchema;
    private readonly name: string;
    private readonly valueSchema: PropertyValueSchema;

    readonly schemaType = "property";

    getName(): string {
        return this.name;
    }

    getUnboxedEntitySchema(): IEntitySchema {
        const unboxedSchema = this.getUnboxedValueSchema();

        if (unboxedSchema.schemaType !== "entity") {
            throw new Error(`unboxed value schema was not of type entity: ${unboxedSchema.schemaType}`);
        }

        return unboxedSchema;
    }

    getUnboxedValueSchema(): IEntitySchema | IPrimitiveSchema {
        const valueSchema = this.getValueSchema();

        switch (valueSchema.schemaType) {
            case "array":
            case "dictionary": {
                const itemSchema = valueSchema.getItemSchema();

                if (itemSchema.schemaType === "primitive") {
                    throw new Error(`value schema of property is of type primitive`);
                }

                return itemSchema;
            }

            default: {
                return valueSchema;
            }
        }
    }

    getValueSchema(): PropertyValueSchema {
        return this.valueSchema;
    }

    isReadOnly(): boolean {
        return this.readOnly;
    }

    isWriteOnly(): boolean {
        return this.writeOnly;
    }

    setReadOnly(flag: boolean): void {
        this.readOnly = flag;
    }

    setWriteOnly(flag: boolean): void {
        this.writeOnly = flag;
    }
}

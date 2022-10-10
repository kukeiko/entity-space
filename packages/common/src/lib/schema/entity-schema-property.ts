import { IEntitySchema, IEntitySchemaProperty, IPrimitiveSchema, IPropertyValueSchema } from "./schema.interface";

export class EntitySchemaProperty implements IEntitySchemaProperty {
    constructor(entitySchema: IEntitySchema, name: string, valueSchema: IPropertyValueSchema, required = false) {
        this.name = name;
        this.valueSchema = valueSchema;
        this.entitySchema = entitySchema;
        this.required = required;
    }

    private required = false;
    private readOnly = false;
    private writeOnly = false;

    private readonly entitySchema: IEntitySchema;
    private readonly name: string;
    private readonly valueSchema: IPropertyValueSchema;

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

    getValueSchema(): IPropertyValueSchema {
        return this.valueSchema;
    }

    isRequired(): boolean {
        return this.required;
    }

    setRequired(flag: boolean): void {
        this.required = flag;
    }

    isReadOnly(): boolean {
        return this.readOnly;
    }

    setReadOnly(flag: boolean): void {
        this.readOnly = flag;
    }

    isWriteOnly(): boolean {
        return this.writeOnly;
    }

    setWriteOnly(flag: boolean): void {
        this.writeOnly = flag;
    }
}

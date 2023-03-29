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

    getName(): string {
        return this.name;
    }

    getUnboxedEntitySchema(): IEntitySchema {
        const unboxedSchema = this.getUnboxedValueSchema();

        if (!unboxedSchema.isEntity()) {
            throw new Error(`unboxed value schema was not of type entity`);
        }

        return unboxedSchema;
    }

    getUnboxedValueSchema(): IEntitySchema | IPrimitiveSchema {
        const valueSchema = this.getValueSchema();

        if (valueSchema.isArray() || valueSchema.isDictionary()) {
            const itemSchema = valueSchema.getItemSchema();

            if (itemSchema.isPrimitive()) {
                // [todo] why did i decide to throw this error here?
                // primitives inside arrays should be fine to have
                throw new Error(`value schema of property is of type primitive`);
            }

            return itemSchema;
        }

        return valueSchema;
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

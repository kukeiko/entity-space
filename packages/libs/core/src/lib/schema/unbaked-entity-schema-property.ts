import { EntitySchema, EntitySchemaProperty, PropertyValueSchema } from "./schema";

export class UnbakedEntitySchemaProperty implements EntitySchemaProperty {
    constructor(entitySchema: EntitySchema, name: string, valueSchema: PropertyValueSchema) {
        this.name = name;
        this.valueSchema = valueSchema;
        this.entitySchema = entitySchema;
    }

    private readOnly = false;
    private writeOnly = false;

    private readonly entitySchema: EntitySchema;
    private readonly name: string;
    private readonly valueSchema: PropertyValueSchema;

    readonly schemaType = "property";

    getName(): string {
        return this.name;
    }

    getValueSchema(): PropertyValueSchema {
        return this.valueSchema;
    }

    // [todo] a bit questionable. added because workspace requires it
    getValueEntitySchema(): EntitySchema {
        const valueSchema = this.getValueSchema();

        switch (valueSchema.schemaType) {
            case "entity":
                return valueSchema;

            case "array":
            case "dictionary": {
                const itemSchema = valueSchema.getItemSchema();

                if (itemSchema.schemaType === "primitive") {
                    throw new Error(`value schema of property is of type primitive`);
                }

                return itemSchema;
            }

            default:
                throw new Error(`property w/ schema type ${valueSchema.schemaType} not supported`);
        }
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

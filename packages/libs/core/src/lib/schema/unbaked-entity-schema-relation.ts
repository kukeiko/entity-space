import { EntitySchema, EntitySchemaIndex, EntitySchemaProperty, EntitySchemaRelation } from "./schema";

export class UnbakedEntitySchemaRelation implements EntitySchemaRelation {
    constructor(entitySchema: EntitySchema, path: string, from: string, to: string) {
        this.entitySchema = entitySchema;
        this.path = path;
        this.from = from;
        this.to = to;
    }

    private readonly entitySchema: EntitySchema;
    private readonly from: string;
    private readonly path: string;
    private readonly to: string;

    getFromIndex(): EntitySchemaIndex {
        return this.entitySchema.getIndexOrKey(this.from);
    }

    getPath(): string {
        return this.path;
    }

    getProperty(): EntitySchemaProperty {
        return this.entitySchema.getProperty(this.path);
    }

    getRelatedSchema(): EntitySchema {
        // [todo] consider implementing a "getUnboxedSchema()" @ property. or maybe even on all types of schemas.
        const valueSchema = this.getProperty().getValueSchema();

        switch (valueSchema.schemaType) {
            case "entity":
                return valueSchema;

            case "array":
            case "dictionary": {
                const itemSchema = valueSchema.getItemSchema();

                if (itemSchema.schemaType === "primitive") {
                    throw new Error(
                        `invalid schema type at relation ${this.getPath()} on schema ${this.entitySchema.getId()}: is a primitive`
                    );
                }

                return itemSchema;
            }

            default:
                throw new Error(`property w/ schema type ${valueSchema.schemaType} not supported`);
        }
    }

    getToIndex(): EntitySchemaIndex {
        const valueSchema = this.getProperty().getValueSchema();
        let toEntitySchema: EntitySchema;

        switch (valueSchema.schemaType) {
            case "array":
            case "dictionary": {
                const itemSchema = valueSchema.getItemSchema();
                if (itemSchema.schemaType === "primitive") {
                    throw new Error(
                        `can not get index ${
                            this.to
                        } from schema ${this.entitySchema.getId()}: property does not contain an entity`
                    );
                }

                toEntitySchema = itemSchema;
                break;
            }

            case "entity": {
                toEntitySchema = valueSchema;
                break;
            }

            default: {
                throw new Error(
                    `can not get index ${this.to} from schema ${this.entitySchema.getId()}: property is not an entity`
                );
            }
        }

        return toEntitySchema.getIndexOrKey(this.to);
    }
}

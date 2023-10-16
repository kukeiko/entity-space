import { IEntitySchema, IEntitySchemaIndex, IEntitySchemaProperty, IEntitySchemaRelation } from "./schema.interface";

export class EntitySchemaRelation implements IEntitySchemaRelation {
    constructor(entitySchema: IEntitySchema, propertyKey: string, from: string[], to: string[]) {
        this.entitySchema = entitySchema;
        this.propertyKey = propertyKey;
        this.from = from;
        this.to = to;
    }

    private readonly entitySchema: IEntitySchema;
    private readonly from: string[];
    private readonly propertyKey: string;
    private readonly to: string[];

    getFromPaths(): string[] {
        return this.from;
    }

    getPropertyName(): string {
        return this.propertyKey;
    }

    getProperty(): IEntitySchemaProperty {
        return this.entitySchema.getProperty(this.propertyKey);
    }

    getRelatedEntitySchema(): IEntitySchema {
        return this.getProperty().getUnboxedEntitySchema();
    }

    getToPaths(): string[] {
        return this.to;
    }
}

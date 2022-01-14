import { EntitySchema, EntitySchemaIndex, EntitySchemaProperty, EntitySchemaRelation } from "./schema";

export class UnbakedEntitySchemaRelation implements EntitySchemaRelation {
    constructor(entitySchema: EntitySchema, propertyKey: string, from: string, to: string) {
        this.entitySchema = entitySchema;
        this.propertyKey = propertyKey;
        this.from = from;
        this.to = to;
    }

    private readonly entitySchema: EntitySchema;
    private readonly from: string;
    private readonly propertyKey: string;
    private readonly to: string;

    getFromIndex(): EntitySchemaIndex {
        return this.entitySchema.getIndexOrKey(this.from);
    }

    getPropertyName(): string {
        return this.propertyKey;
    }

    getProperty(): EntitySchemaProperty {
        return this.entitySchema.getProperty(this.propertyKey);
    }

    getRelatedEntitySchema(): EntitySchema {
        return this.getProperty().getUnboxedEntitySchema();
    }

    getToIndex(): EntitySchemaIndex {
        return this.getRelatedEntitySchema().getIndexOrKey(this.to);
    }
}

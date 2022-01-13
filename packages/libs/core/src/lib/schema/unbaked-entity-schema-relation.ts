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
        return this.getProperty().getUnboxedEntitySchema();
    }

    getToIndex(): EntitySchemaIndex {
        return this.getRelatedSchema().getIndexOrKey(this.to);
    }
}

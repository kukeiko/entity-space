import { IEntitySchema } from "../schema/schema.interface";
import { IEntityType } from "./entity-type.interface";

export class EntityType implements IEntityType {
    constructor(entitySchema: IEntitySchema) {
        this.entitySchema = entitySchema;
    }

    private readonly entitySchema: IEntitySchema;

    getSchema(): IEntitySchema {
        return this.entitySchema;
    }
}

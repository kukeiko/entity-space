import { IEntitySchema } from "../schema/schema.interface";
import { EntityCompositeValueIndex } from "./entity-composite-value-index";
import { IEntityIndex } from "./entity-index.interface";
import { EntityPrimitiveValueIndex } from "./entity-primitive-value-index";
import { IEntityType } from "./entity-type.interface";

export class EntityType implements IEntityType {
    constructor(entitySchema: IEntitySchema) {
        this.entitySchema = entitySchema;

        for (const index of entitySchema.getIndexesIncludingKey()) {
            if (index.getPath().length === 1) {
                this.addIndex(index.getName(), new EntityPrimitiveValueIndex(index));
            } else {
                this.addIndex(index.getName(), new EntityCompositeValueIndex(index));
            }
        }
    }

    private readonly entitySchema: IEntitySchema;
    private indexes = new Map<string, IEntityIndex>();

    getSchema(): IEntitySchema {
        return this.entitySchema;
    }

    addIndex(name: string, index: IEntityIndex): void {
        this.indexes.set(name, index);
    }

    getIndex(name: string): IEntityIndex {
        const index = this.indexes.get(name);

        if (index === void 0) {
            throw new Error(`index '${name}' not found`);
        }

        return index;
    }

    getIndexes(): IEntityIndex[] {
        return Array.from(this.indexes.values());
    }
}

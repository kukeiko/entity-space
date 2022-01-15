import { EntitySchema } from "../schema/public";
import { Entity } from "./entity";

// [todo] use Map instead?
export class NormalizedEntities {
    private readonly entitiesPerSchema = new Map<EntitySchema, Entity[]>();

    getSchemas(): EntitySchema[] {
        return Array.from(this.entitiesPerSchema.keys());
    }

    add(schema: EntitySchema, entities: Entity[]): void {
        let current = this.entitiesPerSchema.get(schema);

        if (current === void 0) {
            current = [];
            this.entitiesPerSchema.set(schema, current);
        }

        this.entitiesPerSchema.set(schema, [...current, ...entities]);
    }

    get(schema: EntitySchema): Entity[] {
        return this.entitiesPerSchema.get(schema) ?? [];
    }
}

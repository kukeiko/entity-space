import { EntitySchemaIndex } from "../schema/schema";
import { Entity } from "./entity";
import { EntityReader } from "./entity-reader";

export class UnbakedEntityReader implements EntityReader {
    readIndex(index: EntitySchemaIndex, entities: Entity[]): (number | string)[][] {
        return entities.map(entity => this.readIndexFromOne(index, entity));
    }

    readIndexFromOne(index: EntitySchemaIndex, entity: Entity): (string | number)[] {
        const key: (string | number)[] = [];

        for (const keyPathPart of index.getPath()) {
            key.push(this.readPart(entity, keyPathPart));
        }

        return key;
    }

    private readPart(item: Entity, keyPathPart: string): number | string {
        const parts = keyPathPart.split(".");
        let value = item;

        for (const part of parts) {
            value = value[part];
        }

        if (typeof value !== "string" && typeof value !== "number") {
            throw new Error(`index "${keyPathPart}" did not evaluate to a string or number`);
        }

        return value;
    }
}

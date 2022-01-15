import { IEntitySchemaIndex } from "../schema/schema.interface";
import { Entity } from "./entity";
import { IEntityReader } from "./entity-reader.interface";

export class EntityReader implements IEntityReader {
    readIndex(index: IEntitySchemaIndex, entities: Entity[]): (number | string)[][] {
        return entities.map(entity => this.readIndexFromOne(index, entity));
    }

    readIndexFromOne(index: IEntitySchemaIndex, entity: Entity): (string | number)[] {
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

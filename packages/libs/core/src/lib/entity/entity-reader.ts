import { EntitySchemaIndex } from "../schema/public";
import { Entity } from "./entity";

export interface EntityReader {
    readIndex(index: EntitySchemaIndex, entities: Entity[]): (number | string)[][];
    readIndexFromOne(index: EntitySchemaIndex, entity: Entity): (number | string)[];
}

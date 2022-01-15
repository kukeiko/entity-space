import { IEntitySchemaIndex } from "../schema/public";
import { Entity } from "./entity";

export interface IEntityReader {
    readIndex(index: IEntitySchemaIndex, entities: Entity[]): (number | string)[][];
    readIndexFromOne(index: IEntitySchemaIndex, entity: Entity): (number | string)[];
}

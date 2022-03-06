import { IEntitySchema } from "../schema/schema.interface";
import { IEntityIndex } from "./entity-index.interface";

export interface IEntityType {
    getSchema(): IEntitySchema;
    getIndex(name: string): IEntityIndex;
    getIndexes(): IEntityIndex[];
}

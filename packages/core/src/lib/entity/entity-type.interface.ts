import { IEntitySchema } from "../schema/schema.interface";

export interface IEntityType {
    getSchema(): IEntitySchema;
}

import { Entity } from "../common/entity.type";
import { IEntitySchema } from "../schema/schema.interface";

export interface IEntityTools {
    toDestructurable(): IEntityTools;
    matchesSchema(entity: Entity, schema: IEntitySchema): boolean;
}

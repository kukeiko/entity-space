import { IEntitySchema } from "../schema/schema.interface";
import { Entity } from "./entity";

export interface IEntityStore {
    create(entities: Entity[], schema: IEntitySchema): Promise<Entity[]>;
}

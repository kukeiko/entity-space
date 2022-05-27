import { IEntitySchema } from "../schema/schema.interface";
import { Entity } from "./entity";

export interface IEntityStore {
    create(entities: Entity[], schema: IEntitySchema): Promise<false | Entity[]>;
    update(entities: Entity[], schema: IEntitySchema): Promise<false | Entity[]>;
    delete(entities: Entity[], schema: IEntitySchema): Promise<boolean>;
}

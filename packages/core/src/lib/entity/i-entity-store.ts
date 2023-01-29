import { Entity } from "../common/entity.type";
import { IEntitySchema } from "../schema/schema.interface";

// [todo] we have a class "EntityStore" that doesn't implement this (on purpose),
// so: the naming is kinda conflicting & confusing.
export interface IEntityStore {
    create(entities: Entity[], schema: IEntitySchema): Promise<false | Entity[]>;
    update(entities: Entity[], schema: IEntitySchema): Promise<false | Entity[]>;
    delete(entities: Entity[], schema: IEntitySchema): Promise<boolean>;
}

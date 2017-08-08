import { StringIndexable, TypeOf } from "../util";

export interface IEntity extends Object, StringIndexable { }
export interface EntityType<T extends IEntity> extends TypeOf<T> { }
export interface AnyEntityType extends EntityType<IEntity> { };
// export interface EntityLik
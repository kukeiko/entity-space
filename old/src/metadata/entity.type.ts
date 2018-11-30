import { StringIndexable, TypeOf } from "../util";

// todo: remove "extends Object" if not needed
export interface IEntity extends Object, StringIndexable { }
export interface EntityType<T extends IEntity> extends TypeOf<T> { }
export interface AnyEntityType extends EntityType<IEntity> { };

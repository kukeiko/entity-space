import { ITypeOf, Indexable } from "../util";

export interface IEntity extends Indexable { }
// todo: consider rename to EntityType
export interface IEntityClass<T extends IEntity> extends ITypeOf<T> { }

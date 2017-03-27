import { ITypeOf, IStringIndexable } from "../util";

export interface IEntity extends IStringIndexable { }

// todo: rename to IEntityClass
export interface IEntityType<T extends IEntity> extends ITypeOf<T> { }

import { ITypeOf, IStringIndexable } from "../util";

export interface IEntity extends IStringIndexable { }
export interface IEntityClass<T extends IEntity> extends ITypeOf<T> { }

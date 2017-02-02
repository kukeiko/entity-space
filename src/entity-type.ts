import { ITypeOf, IStringIndexable } from "./util";

export interface IEntity extends IStringIndexable { }
export interface IEntityType<T extends IEntity> extends ITypeOf<T> { }

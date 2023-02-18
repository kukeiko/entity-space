import { Null, Primitive } from "@entity-space/utils";
import { ICriterion } from "../criterion.interface";

export const IEqualsCriterion$ = Symbol();

export interface IEqualsCriterion<T extends Primitive | typeof Null = Primitive | typeof Null> extends ICriterion {
    readonly [IEqualsCriterion$]: true;
    getValue(): ReturnType<T>;
}

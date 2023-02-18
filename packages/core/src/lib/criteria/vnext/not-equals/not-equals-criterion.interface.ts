import { Null, Primitive } from "@entity-space/utils";
import { ICriterion } from "../criterion.interface";

export const INotEqualsCriterion$ = Symbol();

type PrimitiveValue = ReturnType<Primitive | typeof Null>;

export interface INotEqualsCriterion extends ICriterion {
    readonly [INotEqualsCriterion$]: true;
    getValue(): PrimitiveValue;
}

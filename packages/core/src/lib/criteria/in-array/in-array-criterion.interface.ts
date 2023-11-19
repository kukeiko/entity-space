import { Null, Primitive } from "@entity-space/utils";
import { ICriterion } from "../criterion.interface";

export const IInArrayCriterion$ = Symbol();

export type PrimitiveValue = ReturnType<Primitive | typeof Null>;

export interface IInArrayCriterion extends ICriterion {
    readonly [IInArrayCriterion$]: true;
    getValues(): PrimitiveValue[];
}

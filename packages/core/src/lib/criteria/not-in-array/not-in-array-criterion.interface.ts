import { Null, Primitive } from "@entity-space/utils";
import { ICriterion } from "../criterion.interface";

export const INotInArrayCriterion$ = Symbol();

type PrimitiveValue = ReturnType<Primitive | typeof Null>;

export interface INotInArrayCriterion extends ICriterion {
    readonly [INotInArrayCriterion$]: true;
    getValues(): PrimitiveValue[];
}

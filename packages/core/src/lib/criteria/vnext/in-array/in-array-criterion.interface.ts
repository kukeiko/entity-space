import { Null, Primitive } from "@entity-space/utils";
import { ICriterion } from "../criterion.interface";
import { hasInterfaceMarker } from "../has-interface-marker.fn";

export const IInArrayCriterion$ = Symbol();

type PrimitiveValue = ReturnType<Primitive | typeof Null>;

export interface IInArrayCriterion extends ICriterion {
    readonly [IInArrayCriterion$]: true;
    getValues(): PrimitiveValue[];
}

export module IInArrayCriterion {
    export function is(value: unknown): value is IInArrayCriterion {
        return hasInterfaceMarker(IInArrayCriterion$, value);
    }
}

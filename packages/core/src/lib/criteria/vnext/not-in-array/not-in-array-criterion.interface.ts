import { Null, Primitive } from "@entity-space/utils";
import { ICriterion } from "../criterion.interface";
import { hasInterfaceMarker } from "../has-interface-marker.fn";

export const INotInArrayCriterion$ = Symbol();

type PrimitiveValue = ReturnType<Primitive | typeof Null>;

export interface INotInArrayCriterion extends ICriterion {
    readonly [INotInArrayCriterion$]: true;
    getValues(): PrimitiveValue[];
}

export module INotInArrayCriterion {
    export function is(value: unknown): value is INotInArrayCriterion {
        return hasInterfaceMarker(INotInArrayCriterion$, value);
    }
}

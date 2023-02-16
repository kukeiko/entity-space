import { Null, Primitive } from "@entity-space/utils";
import { ICriterion } from "../criterion.interface";
import { hasInterfaceMarker } from "../has-interface-marker.fn";

export const INotEqualsCriterion$ = Symbol();

type PrimitiveValue = ReturnType<Primitive | typeof Null>;

export interface INotEqualsCriterion extends ICriterion {
    readonly [INotEqualsCriterion$]: true;
    getValue(): PrimitiveValue;
}

export module INotEqualsCriterion {
    export function is(value: unknown): value is INotEqualsCriterion {
        return hasInterfaceMarker(INotEqualsCriterion$, value);
    }
}

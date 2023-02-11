import { Null, Primitive } from "@entity-space/utils";
import { ICriterion } from "../criterion.interface";
import { hasInterfaceMarker } from "../has-interface-marker.fn";

export const IEqualsCriterion$ = Symbol();

export interface IEqualsCriterion<T extends Primitive | typeof Null = Primitive | typeof Null> extends ICriterion {
    readonly [IEqualsCriterion$]: true;
    getValue(): ReturnType<T>;
}

export module IEqualsCriterion {
    export function is(value: unknown): value is IEqualsCriterion {
        return hasInterfaceMarker(IEqualsCriterion$, value);
    }
}

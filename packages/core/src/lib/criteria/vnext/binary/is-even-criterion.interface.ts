import { ICriterion } from "../criterion.interface";
import { hasInterfaceMarker } from "../has-interface-marker.fn";

export const IIsEvenCriterion$ = Symbol();

export interface IIsEvenCriterion extends ICriterion {
    readonly [IIsEvenCriterion$]: true;
}

export module IIsEvenCriterion {
    export function is(value: unknown): value is IIsEvenCriterion {
        return hasInterfaceMarker(IIsEvenCriterion$, value);
    }
}

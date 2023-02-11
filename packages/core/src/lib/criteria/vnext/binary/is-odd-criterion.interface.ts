import { ICriterion } from "../criterion.interface";
import { hasInterfaceMarker } from "../has-interface-marker.fn";

export const IIsOddCriterion$ = Symbol();

export interface IIsOddCriterion extends ICriterion {
    readonly [IIsOddCriterion$]: true;
}

export module IIsOddCriterion {
    export function is(value: unknown): value is IIsOddCriterion {
        return hasInterfaceMarker(IIsOddCriterion$, value);
    }
}

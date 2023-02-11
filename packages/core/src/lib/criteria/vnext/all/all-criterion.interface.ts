import { ICriterion } from "../criterion.interface";
import { hasInterfaceMarker } from "../has-interface-marker.fn";

export const IAllCriterion$ = Symbol();

export interface IAllCriterion extends ICriterion {
    readonly [IAllCriterion$]: true;
}

export module IAllCriterion {
    export function is(value: unknown): value is IAllCriterion {
        return hasInterfaceMarker(IAllCriterion$, value);
    }
}

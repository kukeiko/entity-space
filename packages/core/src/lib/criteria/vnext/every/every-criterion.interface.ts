import { ICriterion } from "../criterion.interface";
import { hasInterfaceMarker } from "../has-interface-marker.fn";

export const IEveryCriterion$ = Symbol();

export interface IEveryCriterion extends ICriterion {
    readonly [IEveryCriterion$]: true;
    getCriterion(): ICriterion;
}

export module IEveryCriterion {
    export function is(value: unknown): value is IEveryCriterion {
        return hasInterfaceMarker(IEveryCriterion$, value);
    }
}

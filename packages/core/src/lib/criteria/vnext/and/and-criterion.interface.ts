import { ICriterion } from "../criterion.interface";
import { hasInterfaceMarker } from "../has-interface-marker.fn";

export const IAndCriterion$ = Symbol();

export interface IAndCriterion extends ICriterion {
    readonly [IAndCriterion$]: true;
    getCriteria(): ICriterion[];
}

export module IAndCriterion {
    export function is(value: unknown): value is IAndCriterion {
        return hasInterfaceMarker(IAndCriterion$, value);
    }
}

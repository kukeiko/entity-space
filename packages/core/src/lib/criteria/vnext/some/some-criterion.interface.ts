import { ICriterion } from "../criterion.interface";
import { hasInterfaceMarker } from "../has-interface-marker.fn";

export const ISomeCriterion$ = Symbol();

export interface ISomeCriterion extends ICriterion {
    readonly [ISomeCriterion$]: true;
    getCriterion(): ICriterion;
}

export module ISomeCriterion {
    export function is(value: unknown): value is ISomeCriterion {
        return hasInterfaceMarker(ISomeCriterion$, value);
    }
}

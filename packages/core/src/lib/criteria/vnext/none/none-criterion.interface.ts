import { ICriterion } from "../criterion.interface";
import { hasInterfaceMarker } from "../has-interface-marker.fn";

export const INoneCriterion$ = Symbol();

export interface INoneCriterion extends ICriterion {
    readonly [INoneCriterion$]: true;
}

export module INoneCriterion {
    export function is(value: unknown): value is INoneCriterion {
        return hasInterfaceMarker(INoneCriterion$, value);
    }
}

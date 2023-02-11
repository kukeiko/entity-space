import { ICriterion } from "../criterion.interface";
import { hasInterfaceMarker } from "../has-interface-marker.fn";

export const INeverCriterion$ = Symbol();

export interface INeverCriterion extends ICriterion {
    readonly [INeverCriterion$]: true;
}

export module INeverCriterion {
    export function is(value: unknown): value is INeverCriterion {
        return hasInterfaceMarker(INeverCriterion$, value);
    }
}

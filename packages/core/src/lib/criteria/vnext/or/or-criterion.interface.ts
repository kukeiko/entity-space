import { ICriterion } from "../criterion.interface";
import { hasInterfaceMarker } from "../has-interface-marker.fn";

export const IOrCriterion$ = Symbol();

export interface IOrCriterion extends ICriterion {
    readonly [IOrCriterion$]: true;
    getCriteria(): ICriterion[];
}

export module IOrCriterion {
    export function is(value: unknown): value is IOrCriterion {
        return hasInterfaceMarker(IOrCriterion$, value);
    }
}

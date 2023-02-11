import { ICriterion } from "../criterion.interface";
import { hasInterfaceMarker } from "../has-interface-marker.fn";
import { FromCriterion, ToCriterion } from "./in-range.types";

export const IInNumberRangeCriterion$ = Symbol();

export interface IInNumberRangeCriterion extends ICriterion {
    readonly [IInNumberRangeCriterion$]: true;
    getFrom(): Readonly<FromCriterion<number>> | null;
    getTo(): Readonly<ToCriterion<number>> | null;
}

export module IInNumberRangeCriterion {
    export function is(value: unknown): value is IInNumberRangeCriterion {
        return hasInterfaceMarker(IInNumberRangeCriterion$, value);
    }
}

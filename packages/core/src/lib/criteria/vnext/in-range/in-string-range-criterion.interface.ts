import { ICriterion } from "../criterion.interface";
import { hasInterfaceMarker } from "../has-interface-marker.fn";
import { FromCriterion, ToCriterion } from "./in-range.types";

export const IInStringRangeCriterion$ = Symbol();

export interface IInStringRangeCriterion extends ICriterion {
    readonly [IInStringRangeCriterion$]: true;
    getFrom(): Readonly<FromCriterion<string>> | null;
    getTo(): Readonly<ToCriterion<string>> | null;
}

export module IInStringRangeCriterion {
    export function is(value: unknown): value is IInStringRangeCriterion {
        return hasInterfaceMarker(IInStringRangeCriterion$, value);
    }
}

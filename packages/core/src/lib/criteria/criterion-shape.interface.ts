import { ICriterion } from "./criterion.interface";
import { hasInterfaceMarker } from "./has-interface-marker.fn";
import { ReshapedCriterion } from "./reshaped-criterion";

export const ICriterionShape$ = Symbol();

export interface ICriterionShape<T extends ICriterion  = ICriterion, V = unknown> {
    readonly [ICriterionShape$]: true;
    reshape(criterion: ICriterion): false | ReshapedCriterion<T>;
    toString(): string;
}

export module ICriterionShape {
    export function is(value: unknown): value is ICriterionShape<ICriterion, unknown> {
        return hasInterfaceMarker(ICriterionShape$, value);
    }
}

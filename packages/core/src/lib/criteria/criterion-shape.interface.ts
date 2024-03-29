import { ICriterion } from "./criterion.interface";
import { hasInterfaceMarker } from "./has-interface-marker.fn";
import { ReshapedCriterion } from "./reshaped-criterion";

export const ICriterionShape$ = Symbol();

export interface ICriterionShape<T extends ICriterion = ICriterion> {
    readonly [ICriterionShape$]: true;
    reshape(criterion: ICriterion): false | ReshapedCriterion<T>;
    toString(): string;
}

export module ICriterionShape {
    // [todo] move to tools
    export function is(value: unknown): value is ICriterionShape {
        return hasInterfaceMarker(ICriterionShape$, value);
    }
}

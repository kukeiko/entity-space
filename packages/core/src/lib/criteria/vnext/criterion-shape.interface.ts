import { ICriterion } from "./criterion.interface";
import { hasInterfaceMarker } from "./has-interface-marker.fn";
import { ReshapedCriterion } from "./reshaped-criterion";

export const ICriterionShape$ = Symbol();

export interface ICriterionShape<T extends ICriterion  = ICriterion, V = unknown> {
    readonly [ICriterionShape$]: true;
    // [todo] i forgot that each implementation would actually need to do type checking,
    // as you can have "const shape : ICriterionShape<ICriterion, unknown> = {...}"
    // and nothing would stop you from calling shape.read() with a equals-value criterion,
    // even though the shape is actually an EntityCriteriaShape.
    // for now, it is kind of safe, as there is no code yet that makes use of this method.
    read(criterion: T): V;
    reshape(criterion: ICriterion): false | ReshapedCriterion<T>;
    toString(): string;
}

export module ICriterionShape {
    export function is(value: unknown): value is ICriterionShape<ICriterion, unknown> {
        return hasInterfaceMarker(ICriterionShape$, value);
    }
}

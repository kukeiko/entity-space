import { ICriterion } from "../criterion.interface";
import { hasInterfaceMarker } from "../has-interface-marker.fn";

export const IEntityCriteria$ = Symbol();

export interface IEntityCriteria extends ICriterion {
    readonly [IEntityCriteria$]: true;
    getCriteria(): Record<string, ICriterion>;
    getByPath(path: string[]): ICriterion | undefined;
}

export module IEntityCriteria {
    export function is(value: unknown): value is IEntityCriteria {
        return hasInterfaceMarker(IEntityCriteria$, value);
    }
}

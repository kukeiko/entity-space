import { ICriterion } from "../criterion.interface";

export const INoneCriterion$ = Symbol();

export interface INoneCriterion extends ICriterion {
    readonly [INoneCriterion$]: true;
}

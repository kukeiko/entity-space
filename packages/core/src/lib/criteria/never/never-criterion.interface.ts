import { ICriterion } from "../criterion.interface";

export const INeverCriterion$ = Symbol();

export interface INeverCriterion extends ICriterion {
    readonly [INeverCriterion$]: true;
}

import { ICriterion } from "../criterion.interface";

export const IIsEvenCriterion$ = Symbol();

export interface IIsEvenCriterion extends ICriterion {
    readonly [IIsEvenCriterion$]: true;
}

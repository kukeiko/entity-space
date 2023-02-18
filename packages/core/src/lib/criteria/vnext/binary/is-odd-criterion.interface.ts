import { ICriterion } from "../criterion.interface";

export const IIsOddCriterion$ = Symbol();

export interface IIsOddCriterion extends ICriterion {
    readonly [IIsOddCriterion$]: true;
}

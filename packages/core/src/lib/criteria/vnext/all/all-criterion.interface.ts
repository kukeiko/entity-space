import { ICriterion } from "../criterion.interface";

export const IAllCriterion$ = Symbol();

export interface IAllCriterion extends ICriterion {
    readonly [IAllCriterion$]: true;
}

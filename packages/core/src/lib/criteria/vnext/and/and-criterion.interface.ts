import { ICriterion } from "../criterion.interface";

export const IAndCriterion$ = Symbol();

export interface IAndCriterion extends ICriterion {
    readonly [IAndCriterion$]: true;
    getCriteria(): ICriterion[];
}

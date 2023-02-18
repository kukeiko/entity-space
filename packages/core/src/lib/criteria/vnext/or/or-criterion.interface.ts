import { ICriterion } from "../criterion.interface";

export const IOrCriterion$ = Symbol();

export interface IOrCriterion extends ICriterion {
    readonly [IOrCriterion$]: true;
    getCriteria(): ICriterion[];
}

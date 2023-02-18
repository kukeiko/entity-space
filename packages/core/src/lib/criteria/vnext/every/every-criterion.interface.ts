import { ICriterion } from "../criterion.interface";

export const IEveryCriterion$ = Symbol();

export interface IEveryCriterion extends ICriterion {
    readonly [IEveryCriterion$]: true;
    getCriterion(): ICriterion;
}

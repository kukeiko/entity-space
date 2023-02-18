import { ICriterion } from "../criterion.interface";

export const ISomeCriterion$ = Symbol();

export interface ISomeCriterion extends ICriterion {
    readonly [ISomeCriterion$]: true;
    getCriterion(): ICriterion;
}

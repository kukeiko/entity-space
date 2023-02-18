import { ICriterion } from "../criterion.interface";
import { FromCriterion, ToCriterion } from "./in-range.types";

export const IInNumberRangeCriterion$ = Symbol();

export interface IInNumberRangeCriterion extends ICriterion {
    readonly [IInNumberRangeCriterion$]: true;
    getFrom(): Readonly<FromCriterion<number>> | null;
    getTo(): Readonly<ToCriterion<number>> | null;
}

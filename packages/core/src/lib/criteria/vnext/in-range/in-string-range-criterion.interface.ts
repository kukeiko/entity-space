import { ICriterion } from "../criterion.interface";
import { FromCriterion, ToCriterion } from "./in-range.types";

export const IInStringRangeCriterion$ = Symbol();

export interface IInStringRangeCriterion extends ICriterion {
    readonly [IInStringRangeCriterion$]: true;
    getFrom(): Readonly<FromCriterion<string>> | null;
    getTo(): Readonly<ToCriterion<string>> | null;
}

import { NotInSetCriterion } from "./not-in";
import { InSetCriterion } from "./in";
import { InRangeCriterion } from "./from-to";

export type ValueCriterion = InRangeCriterion | InSetCriterion | NotInSetCriterion;

import { NotInSetCriterion } from "./not-in";
import { InSetCriterion } from "./in";
import { InRangeCriterion } from "./in-range";

export type ValueCriterion = InRangeCriterion | InSetCriterion | NotInSetCriterion;

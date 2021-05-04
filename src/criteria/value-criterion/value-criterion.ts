import { NotInValueCriterion } from "./not-in";
import { InValueCriterion } from "./in";
import { FromToValueCriterion } from "./from-to";

export type ValueCriterion = FromToValueCriterion | InValueCriterion | NotInValueCriterion;

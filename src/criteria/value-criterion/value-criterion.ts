import { NotInValueCriterion } from "./not-in-value-criterion";
import { InValueCriterion } from "./in-value-criterion";
import { FromToValueCriterion } from "./from-to-value-criterion";

export type ValueCriterion = FromToValueCriterion | InValueCriterion | NotInValueCriterion;

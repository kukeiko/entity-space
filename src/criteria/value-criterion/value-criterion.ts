import { NotInValueCriterion } from "./not-in/not-in-value-criterion";
import { InValueCriterion } from "./in/in-value-criterion";
import { FromToValueCriterion } from "./from-to/from-to-value-criterion";

export type ValueCriterion = FromToValueCriterion | InValueCriterion | NotInValueCriterion;

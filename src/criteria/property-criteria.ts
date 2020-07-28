import { ValueCriteria } from "./value-criterion";
import { ValuesCriteria } from "./values-criterion";
import { Criteria } from "./criteria";

export type PropertyCriteria = ValueCriteria | ValuesCriteria | Criteria;

import { ValueCriteria } from "./value-criterion";
import { ValuesCriteria } from "./values-criterion";
import { ObjectCriteria } from "./object-criteria";

export type PropertyCriteria = ValueCriteria | ValuesCriteria | ObjectCriteria;

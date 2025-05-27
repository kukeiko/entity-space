import { AndCriterion } from "./and-criterion";
import { EntityCriterion } from "./entity-criterion";
import { EqualsCriterion } from "./equals-criterion";
import { InArrayCriterion } from "./in-array-criterion";
import { InRangeCriterion } from "./in-range-criterion";
import { NotEqualsCriterion } from "./not-equals-criterion";
import { NotInArrayCriterion } from "./not-in-array-criterion";
import { OrCriterion } from "./or-criterion";

const allCriterionTypes = [
    AndCriterion,
    EntityCriterion,
    EqualsCriterion,
    InArrayCriterion,
    InRangeCriterion,
    NotEqualsCriterion,
    NotInArrayCriterion,
    OrCriterion,
] as const;

export type AllCriterionTypes = (typeof allCriterionTypes)[number];

import { AndCriterion } from "./and-criterion";
import { EntityCriterion } from "./entity-criterion";
import { EqualsCriterion } from "./equals-criterion";
import { InArrayCriterion } from "./in-array-criterion";
import { InRangeCriterion } from "./in-range-criterion";
import { NoneCriterion } from "./none-criterion";
import { NotEqualsCriterion } from "./not-equals-criterion";
import { NotInArrayCriterion } from "./not-in-array-criterion";
import { OrCriterion } from "./or-criterion";
import { SomeCriterion } from "./some-criterion";

const allCriterionTypes = [
    AndCriterion,
    EntityCriterion,
    EqualsCriterion,
    InArrayCriterion,
    InRangeCriterion,
    NotEqualsCriterion,
    NotInArrayCriterion,
    OrCriterion,
    SomeCriterion,
    NoneCriterion,
] as const;

export type AllCriterionTypes = (typeof allCriterionTypes)[number];

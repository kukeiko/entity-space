import { AllCriterionTypes } from "../all-criterion-types";
import { AndCriterion } from "../and-criterion";
import { Criterion } from "../criterion";
import { OrCriterion } from "../or-criterion";
import { subtractByAndCriterion } from "./subtract-by-and-criterion.fn";
import { subtractByEntityCriterion } from "./subtract-by-entity-criterion.fn";
import { subtractByEqualsCriterion } from "./subtract-by-equals-criterion.fn";
import { subtractByInArrayCriterion } from "./subtract-by-in-array-criterion.fn";
import { subtractByInRangeCriterion } from "./subtract-by-in-range-criterion.fn";
import { subtractByNotEqualsCriterion } from "./subtract-by-not-equals-criterion.fn";
import { subtractByNotInArrayCriterion } from "./subtract-by-not-in-array-criterion.fn";
import { subtractByOrCriterion } from "./subtract-by-or-criterion.fn";
import { subtractFromAndCriterion } from "./subtract-from-and-criterion.fn";
import { subtractFromOrCriterion } from "./subtract-from-or-criterion.fn";

type Subtractor<T> = (by: T, what: Criterion) => Criterion | boolean;

type Subtractors = {
    [K in InstanceType<AllCriterionTypes>["type"]]: Subtractor<
        Extract<InstanceType<AllCriterionTypes>, Record<"type", K>>
    >;
};

const subtractors: Subtractors = {
    and: subtractByAndCriterion,
    entity: subtractByEntityCriterion,
    equals: subtractByEqualsCriterion,
    "in-array": subtractByInArrayCriterion,
    "in-range": subtractByInRangeCriterion,
    "not-equals": subtractByNotEqualsCriterion,
    "not-in-array": subtractByNotInArrayCriterion,
    or: subtractByOrCriterion,
};

export function subtractCriterion(what: Criterion, by: Criterion): Criterion | boolean {
    if (what instanceof OrCriterion) {
        return subtractFromOrCriterion(what, by);
    } else if (what instanceof AndCriterion) {
        return subtractFromAndCriterion(what, by);
    }

    const type = by.type;

    if (type in subtractors) {
        return (subtractors[type as keyof Subtractors] as Subtractor<Criterion>)(by, what);
    }

    throw new Error(`unknown criterion type: ${type}`);
}

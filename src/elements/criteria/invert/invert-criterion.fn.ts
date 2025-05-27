import { AllCriterionTypes } from "../all-criterion-types";
import { AndCriterion } from "../and-criterion";
import { Criterion } from "../criterion";
import { EntityCriterion } from "../entity-criterion";
import { EqualsCriterion } from "../equals-criterion";
import { InArrayCriterion } from "../in-array-criterion";
import { InRangeCriterion } from "../in-range-criterion";
import { NotEqualsCriterion } from "../not-equals-criterion";
import { NotInArrayCriterion } from "../not-in-array-criterion";
import { OrCriterion } from "../or-criterion";

function invertAndCriterion(criterion: AndCriterion): Criterion {
    const invertedCriteria = criterion
        .getCriteria()
        .map(invertCriterion)
        .flatMap(criterion => (criterion instanceof AndCriterion ? criterion.getCriteria() : criterion));

    return new AndCriterion(invertedCriteria);
}

function invertOrCriterion(criterion: OrCriterion): Criterion {
    const invertedCriteria = criterion
        .getCriteria()
        .map(invertCriterion)
        .flatMap(criterion => (criterion instanceof OrCriterion ? criterion.getCriteria() : criterion));

    return new OrCriterion(invertedCriteria);
}

function invertEntityCriterion(criterion: EntityCriterion): Criterion {
    const invertedCriteria = Object.fromEntries(
        Object.entries(criterion.getCriteria()).map(([key, criterion]) => [key, invertCriterion(criterion)]),
    );

    const accumulator: Record<string, Criterion> = {};
    const built: Record<string, Criterion>[] = [];

    for (const [key, invertedCriterion] of Object.entries(invertedCriteria)) {
        built.push({ ...accumulator, [key]: invertedCriterion });
        accumulator[key] = criterion.getCriteria()[key]!;
    }

    return built.length === 1
        ? new EntityCriterion(built[0])
        : new OrCriterion(built.map(bag => new EntityCriterion(bag)));
}

function invertInRangeCriterion(criterion: InRangeCriterion): Criterion {
    const inverted: Criterion[] = [];
    const from = criterion.getFrom();

    if (from !== undefined) {
        inverted.push(new InRangeCriterion(undefined, from.value, !from.inclusive));
    }

    const to = criterion.getTo();

    if (to !== undefined) {
        inverted.push(new InRangeCriterion(to.value, undefined, !to.inclusive));
    }

    return inverted.length === 1 ? inverted[0] : new OrCriterion(inverted);
}

type Inverter<T> = (criterion: T) => Criterion;

type Inverters = {
    [K in InstanceType<AllCriterionTypes>["type"]]: Inverter<
        Extract<InstanceType<AllCriterionTypes>, Record<"type", K>>
    >;
};

const inverters: Inverters = {
    and: invertAndCriterion,
    entity: invertEntityCriterion,
    equals: criterion => new NotEqualsCriterion(criterion.getValue()),
    "in-array": criterion => new NotInArrayCriterion(criterion.getValues()),
    "in-range": invertInRangeCriterion,
    "not-equals": criterion => new EqualsCriterion(criterion.getValue()),
    "not-in-array": criterion => new InArrayCriterion(criterion.getValues()),
    or: invertOrCriterion,
};

export function invertCriterion(criterion: Criterion): Criterion {
    const type = criterion.type;

    if (type in inverters) {
        return (inverters[type as keyof Inverters] as Inverter<Criterion>)(criterion);
    }

    throw new Error(`unknown criterion type: ${type}`);
}

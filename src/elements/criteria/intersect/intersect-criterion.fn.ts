import { isNot } from "@entity-space/utils";
import { AllCriterionTypes } from "../all-criterion-types";
import { AndCriterion } from "../and-criterion";
import { Criterion } from "../criterion";
import { EntityCriterion } from "../entity-criterion";
import { EqualsCriterion } from "../equals-criterion";
import { InArrayCriterion } from "../in-array-criterion";
import { InRangeCriterion, isFromInsideFromTo, isToInsideFromTo } from "../in-range-criterion";
import { NotEqualsCriterion } from "../not-equals-criterion";
import { NotInArrayCriterion } from "../not-in-array-criterion";
import { OrCriterion } from "../or-criterion";

function intersectInArrayCriterion(criterion: InArrayCriterion, other: Criterion): Criterion | false {
    const intersection = Array.from(criterion.getValues()).filter(value => other.contains(value));

    if (!intersection.length) {
        return false;
    } else if (intersection.length === 1) {
        return new EqualsCriterion(intersection[0]);
    } else {
        return new InArrayCriterion(intersection);
    }
}

function intersectNotEqualsCriterion(criterion: NotEqualsCriterion, other: Criterion): Criterion | false {
    if (other instanceof EqualsCriterion) {
        if (criterion.contains(other.getValue())) {
            return other;
        }
    } else if (other instanceof InArrayCriterion) {
        const contained = other.getValues().filter(value => criterion.contains(value));

        if (!contained.length) {
            return false;
        } else if (contained.length === 1) {
            return new EqualsCriterion(contained[0]);
        } else {
            return new InArrayCriterion(contained);
        }
    } else if (other instanceof NotEqualsCriterion) {
        if (criterion.getValue() === other.getValue()) {
            return criterion;
        } else {
            return new NotInArrayCriterion([criterion.getValue(), other.getValue()]);
        }
    } else if (other instanceof NotInArrayCriterion) {
        const values = Array.from(new Set([criterion.getValue(), ...other.getValues()]));

        if (values.length === 1) {
            return new NotEqualsCriterion(values[0]);
        } else {
            return new NotInArrayCriterion(values);
        }
    } else if (other instanceof InRangeCriterion && other.isNumber()) {
        const value = criterion.getValue();

        if (typeof value !== "number") {
            return false;
        }

        if (!other.contains(criterion.getValue())) {
            return other;
        }

        if (other.getFrom()?.value == value) {
            return new InRangeCriterion(other.getFrom()?.value, other.getTo()?.value, [
                false,
                other.getTo()?.inclusive!,
            ]);
        } else if (other.getTo()?.value == value) {
            return new InRangeCriterion(other.getFrom()?.value, other.getTo()?.value, [
                other.getFrom()?.inclusive!,
                false,
            ]);
        } else {
            const before = new InRangeCriterion(other.getFrom()?.value, value, [other.getFrom()?.inclusive, false]);
            const after = new InRangeCriterion(value, other.getTo()?.value, [false, other.getTo()?.inclusive]);

            return new OrCriterion([before, after]);
        }
    }

    return false;
}

function intersectNotInArrayCriterion(criterion: NotInArrayCriterion, other: Criterion): Criterion | false {
    if (other instanceof NotEqualsCriterion) {
        const values = Array.from(new Set([...criterion.getValues(), other.getValue()]));

        if (values.length === 1) {
            return new NotEqualsCriterion(values[0]);
        } else {
            return new NotInArrayCriterion(values);
        }
    } else if (other instanceof NotInArrayCriterion) {
        return new NotInArrayCriterion([...criterion.getValues(), ...other.getValues()]);
    } else if (other instanceof InArrayCriterion) {
        const intersected = other.getValues().filter(value => criterion.contains(value));

        if (intersected.length === 1) {
            return new EqualsCriterion(intersected[0]);
        } else if (intersected.length) {
            return new InArrayCriterion(intersected);
        }
    } else if (other instanceof EqualsCriterion) {
        if (criterion.contains(other.getValue())) {
            return other;
        }
    }

    return false;
}

function intersectInRangeCriterion(criterion: InRangeCriterion, other: Criterion): Criterion | false {
    if (other instanceof EqualsCriterion) {
        if (criterion.contains(other.getValue())) {
            return other;
        }
    } else if (other instanceof InRangeCriterion) {
        const [otherFrom, otherTo, selfFrom, selfTo] = [
            other.getFrom(),
            other.getTo(),
            criterion.getFrom(),
            criterion.getTo(),
        ];

        const otherFromInsideMe = isFromInsideFromTo(other.getFrom(), criterion.getFrom(), criterion.getTo());
        const otherToInsideMe = isToInsideFromTo(other.getTo(), criterion.getFrom(), criterion.getTo());

        if (otherFromInsideMe && otherToInsideMe) {
            return new InRangeCriterion(otherFrom?.value, otherTo?.value, [
                !!otherFrom?.inclusive,
                !!otherTo?.inclusive,
            ]);
        } else if (otherFromInsideMe) {
            if (selfTo === undefined) {
                return new InRangeCriterion(otherFrom?.value, undefined, !!otherFrom?.inclusive);
            } else {
                return new InRangeCriterion(otherFrom?.value, selfTo.value, [!!otherFrom?.inclusive, selfTo.inclusive]);
            }
        } else if (otherToInsideMe) {
            if (selfFrom === undefined) {
                return new InRangeCriterion(undefined, otherTo?.value, !!otherTo?.inclusive);
            } else {
                return new InRangeCriterion(selfFrom.value, otherTo?.value, [selfFrom.inclusive, !!otherTo?.inclusive]);
            }
        } else if (
            isFromInsideFromTo(selfFrom, other.getFrom(), other.getTo()) &&
            isToInsideFromTo(selfTo, other.getFrom(), other.getTo())
        ) {
            return new InRangeCriterion(selfFrom?.value, selfTo?.value, [!!selfFrom?.inclusive, !!selfTo?.inclusive]);
        }
    }

    return false;
}

function intersectEntityCriterion(criterion: EntityCriterion, other: Criterion): Criterion | false {
    if (!(other instanceof EntityCriterion)) {
        return false;
    }

    const keys = new Set([...Object.keys(criterion.getCriteria()), ...Object.keys(other.getCriteria())]);
    const criteria: Record<string, Criterion> = {};

    for (const key of keys) {
        const left = criterion.getCriteria()[key];
        const right = other.getCriteria()[key];

        if (!left) {
            criteria[key] = right;
        } else if (!right) {
            criteria[key] = left;
        } else {
            const intersection = intersectCriterion(left, right);

            if (!intersection) {
                return false;
            }

            criteria[key] = intersection;
        }
    }

    return new EntityCriterion(criteria);
}

function intersectOrCriterion(criterion: OrCriterion, other: Criterion): Criterion | false {
    const intersectedCriteria = criterion
        .getCriteria()
        .map(criterion => intersectCriterion(criterion, other))
        .filter(isNot(false))
        .flatMap(criterion => (criterion instanceof OrCriterion ? criterion.getCriteria() : criterion));

    if (!intersectedCriteria.length) {
        return false;
    } else if (intersectedCriteria.length === 1) {
        return intersectedCriteria[0];
    } else {
        return new OrCriterion(intersectedCriteria);
    }
}

type Intersecter<T> = (criterion: T, other: Criterion) => Criterion | false;

type Intersecters = {
    [K in InstanceType<AllCriterionTypes>["type"]]: Intersecter<
        Extract<InstanceType<AllCriterionTypes>, Record<"type", K>>
    >;
};

const intersecters: Intersecters = {
    and: () => false, // [todo] implement
    entity: intersectEntityCriterion,
    equals: (criterion, other) => (other.contains(criterion.getValue()) ? criterion : false),
    "in-array": intersectInArrayCriterion,
    "in-range": intersectInRangeCriterion,
    "not-equals": intersectNotEqualsCriterion,
    "not-in-array": intersectNotInArrayCriterion,
    or: intersectOrCriterion,
};

export function intersectCriterion(criterion: Criterion, other: Criterion): Criterion | false {
    if (other instanceof OrCriterion || other instanceof AndCriterion) {
        [criterion, other] = [other, criterion];
    }

    const type = criterion.type;

    if (type in intersecters) {
        return (intersecters[type as keyof Intersecters] as Intersecter<Criterion>)(criterion, other);
    }

    throw new Error(`unknown criterion type: ${type}`);
}

import { intersection } from "lodash";
import { AllCriterionTypes } from "../all-criterion-types";
import { AndCriterion } from "../and-criterion";
import { Criterion } from "../criterion";
import { EntityCriterion } from "../entity-criterion";
import { EqualsCriterion } from "../equals-criterion";
import { InArrayCriterion } from "../in-array-criterion";
import { NotEqualsCriterion } from "../not-equals-criterion";
import { NotInArrayCriterion } from "../not-in-array-criterion";
import { OrCriterion } from "../or-criterion";
import { subtractCriterion } from "../subtract/subtract-criterion.fn";
import { mergeInRangeCriterion } from "./merge-in-range-criterion.fn";

function mergeEntityCriterion(criterion: EntityCriterion, other: Criterion): Criterion | boolean {
    if (!(other instanceof EntityCriterion)) {
        return false;
    }

    const merged: Record<string, Criterion> = {};
    const otherBag = other.getCriteria();
    let mergedOne = false;

    for (const [key, myBagCriterion] of Object.entries(criterion.getCriteria())) {
        const otherBagCriterion = otherBag[key];

        if (otherBagCriterion === undefined) {
            return false;
        } else if (otherBagCriterion instanceof Criterion) {
            const mergedResult = mergeCriterion(myBagCriterion, otherBagCriterion);

            if (mergedResult === false) {
                return false;
            } else if (mergedResult !== true) {
                const isMineSubsetOfOther = subtractCriterion(otherBagCriterion, myBagCriterion) === true;
                const isOtherSubsetOfMine = subtractCriterion(myBagCriterion, otherBagCriterion) === true;

                if (!(isMineSubsetOfOther && isOtherSubsetOfMine)) {
                    if (mergedOne) {
                        return false;
                    }

                    mergedOne = true;
                }

                merged[key] = mergedResult;
            }
        }
    }

    return Object.keys(merged).length ? new EntityCriterion(merged) : true;
}

function mergeEqualsCriterion(criterion: EqualsCriterion, other: Criterion): Criterion | boolean {
    if (other instanceof EqualsCriterion) {
        return new InArrayCriterion([criterion.getValue(), other.getValue()]);
    } else if (other instanceof InArrayCriterion) {
        return new InArrayCriterion([...other.getValues(), criterion.getValue()]);
    } else if (other instanceof NotEqualsCriterion) {
        return true;
    }

    return false;
}

function mergeInArrayCriterion(criterion: InArrayCriterion, other: Criterion): Criterion | boolean {
    if (other instanceof InArrayCriterion) {
        return new InArrayCriterion([...criterion.getValues(), ...other.getValues()]);
    } else if (other instanceof EqualsCriterion) {
        return new InArrayCriterion([...criterion.getValues(), other.getValue()]);
    }

    return false;
}

function mergeNotEqualsCriterion(criterion: NotEqualsCriterion, other: Criterion): Criterion | boolean {
    if (other instanceof NotEqualsCriterion && criterion.getValue() === other.getValue()) {
        return criterion;
    }

    return false;
}

function mergeNotInArrayCriterion(criterion: NotInArrayCriterion, other: Criterion): Criterion | boolean {
    if (other instanceof NotInArrayCriterion) {
        const intersected = intersection(criterion.getValues(), other.getValues());

        if (intersected.length) {
            return new NotInArrayCriterion(intersected);
        } else {
            return true;
        }
    } else if (other instanceof NotEqualsCriterion) {
        if (!criterion.contains(other.getValue())) {
            return other;
        } else {
            return true;
        }
    } else if (other instanceof InArrayCriterion) {
        const otherValues = new Set(other.getValues());
        const remainingValues = criterion.getValues().filter(value => !otherValues.has(value));

        return remainingValues.length ? new NotInArrayCriterion(remainingValues) : true;
    } else if (other instanceof EqualsCriterion) {
        if (!criterion.contains(other.getValue())) {
            const values = new Set(criterion.getValues());
            values.delete(other.getValue());

            return values.size ? new NotInArrayCriterion(Array.from(values)) : true;
        }
    }

    return false;
}

function mergeOrCriterion(criterion: OrCriterion, other: Criterion): Criterion | boolean {
    const unmerged: Criterion[] = [];
    let merged = other;
    const orCriterion = criterion;

    for (const criterion of orCriterion.getCriteria()) {
        const mergeResult = mergeCriterion(criterion, merged);

        if (mergeResult === false) {
            unmerged.push(criterion);
        } else if (mergeResult === true) {
            return true;
        } else {
            merged = mergeResult;
        }
    }

    return unmerged.length ? new OrCriterion([merged, ...unmerged]) : merged;
}

type Merger<T> = (criterion: T, other: Criterion) => Criterion | boolean;

type Mergers = {
    [K in InstanceType<AllCriterionTypes>["type"]]: Merger<Extract<InstanceType<AllCriterionTypes>, Record<"type", K>>>;
};

const mergers: Mergers = {
    and: () => false, // [todo] implement
    entity: mergeEntityCriterion,
    equals: mergeEqualsCriterion,
    "in-array": mergeInArrayCriterion,
    "in-range": mergeInRangeCriterion,
    "not-equals": mergeNotEqualsCriterion,
    "not-in-array": mergeNotInArrayCriterion,
    or: mergeOrCriterion,
};

export function mergeCriterion(criterion: Criterion, other: Criterion): Criterion | boolean {
    // we can skip merging if one is a subset of the other
    if (subtractCriterion(criterion, other) === true) {
        return other;
    } else if (subtractCriterion(other, criterion) === true) {
        return criterion;
    }

    if (other instanceof OrCriterion || other instanceof AndCriterion) {
        [criterion, other] = [other, criterion];
    }

    const type = criterion.type;

    if (type in mergers) {
        return (mergers[type as keyof Mergers] as Merger<Criterion>)(criterion, other);
    }

    throw new Error(`unknown criterion type: ${type}`);
}

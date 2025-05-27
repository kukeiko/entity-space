import { isPrimitiveOfType, permutateEntries, Primitive, primitiveToType } from "@entity-space/utils";
import { partition } from "lodash";
import { AllCriterionShapeTypes } from "../all-criterion-shape-types";
import { AndCriterion } from "../and-criterion";
import { Criterion } from "../criterion";
import { CriterionShape } from "../criterion-shape";
import { EntityCriterion } from "../entity-criterion";
import { EntityCriterionShape } from "../entity-criterion-shape";
import { EqualsCriterion } from "../equals-criterion";
import { EqualsCriterionShape } from "../equals-criterion-shape";
import { InArrayCriterion } from "../in-array-criterion";
import { InArrayCriterionShape } from "../in-array-criterion-shape";
import { InRangeCriterion } from "../in-range-criterion";
import { InRangeCriterionShape } from "../in-range-criterion-shape";
import { NotEqualsCriterion } from "../not-equals-criterion";
import { NotEqualsCriterionShape } from "../not-equals-criterion-shape";
import { NotInArrayCriterion } from "../not-in-array-criterion";
import { NotInArrayCriterionShape } from "../not-in-array-criterion-shape";
import { OrCriterion } from "../or-criterion";
import { OrCriterionShape } from "../or-criterion-shape";
import { ReshapedCriterion } from "../reshaped-criterion";
import { subtractCriterion } from "../subtract/subtract-criterion.fn";

function reshapeByEquals(shape: EqualsCriterionShape, criterion: Criterion): ReshapedCriterion | false {
    if (criterion instanceof EqualsCriterion) {
        if (isPrimitiveOfType(shape.getValueTypes())(criterion.getValue())) {
            return new ReshapedCriterion([criterion]);
        }

        return false;
    } else if (criterion instanceof InArrayCriterion) {
        const [values, openValues] = partition(
            criterion.getValues(),
            isPrimitiveOfType(shape.getValueTypes()),
        ) as unknown as [ReturnType<Primitive>[], ReturnType<Primitive>[]];

        if (!values.length) {
            return false;
        }

        let open: Criterion[] = [];

        if (openValues.length === 1) {
            open = [new EqualsCriterion(openValues[0])];
        } else if (openValues.length > 1) {
            open = [new InArrayCriterion(openValues)];
        }

        const reshaped = values.map(value => new EqualsCriterion(value));
        return new ReshapedCriterion(reshaped, open);
    }

    return false;
}

function reshapeByInArray(shape: InArrayCriterionShape, criterion: Criterion): ReshapedCriterion | false {
    if (criterion instanceof InArrayCriterion) {
        const [values, openValues] = partition(
            criterion.getValues(),
            isPrimitiveOfType(shape.getValueTypes()),
        ) as unknown as [ReturnType<Primitive>[], ReturnType<Primitive>[]];

        if (values.length) {
            const reshaped = [new InArrayCriterion(values)];
            const open = openValues.length ? [new InArrayCriterion(openValues)] : [];

            return new ReshapedCriterion(reshaped, open);
        }
    } else if (criterion instanceof EqualsCriterion) {
        if (isPrimitiveOfType(shape.getValueTypes())(criterion.getValue())) {
            return new ReshapedCriterion([new InArrayCriterion([criterion.getValue()])]);
        }
    }

    return false;
}

function reshapeByNotEquals(shape: NotEqualsCriterionShape, criterion: Criterion): ReshapedCriterion | false {
    if (criterion instanceof NotEqualsCriterion) {
        if (isPrimitiveOfType(shape.getValueTypes())(criterion.getValue())) {
            return new ReshapedCriterion([criterion]);
        }

        return false;
    } else if (criterion instanceof NotInArrayCriterion) {
        const [values, openValues] = partition(
            criterion.getValues(),
            isPrimitiveOfType(shape.getValueTypes()),
        ) as unknown as [ReturnType<Primitive>[], ReturnType<Primitive>[]];

        if (!values.length) {
            return false;
        }

        let open: Criterion[] = [];

        if (openValues.length === 1) {
            open = [new NotEqualsCriterion(openValues[0])];
        } else if (openValues.length > 1) {
            open = [new NotInArrayCriterion(openValues)];
        }

        const reshaped = values.map(value => new NotEqualsCriterion(value));
        return new ReshapedCriterion(reshaped, open);
    }

    return false;
}

function reshapeByNotInArray(shape: NotInArrayCriterionShape, criterion: Criterion): ReshapedCriterion | false {
    if (criterion instanceof NotInArrayCriterion) {
        const [values, openValues] = partition(
            criterion.getValues(),
            isPrimitiveOfType(shape.getValueTypes()),
        ) as unknown as [ReturnType<Primitive>[], ReturnType<Primitive>[]];

        if (values.length) {
            const reshaped = [new NotInArrayCriterion(values)];
            const open = openValues.length ? [new NotInArrayCriterion(openValues)] : [];

            return new ReshapedCriterion(reshaped, open);
        }
    } else if (criterion instanceof NotEqualsCriterion) {
        if (isPrimitiveOfType(shape.getValueTypes())(criterion.getValue())) {
            return new ReshapedCriterion([new NotInArrayCriterion([criterion.getValue()])]);
        }
    }

    return false;
}

function reshapeByInRange(shape: InRangeCriterionShape, criterion: Criterion): ReshapedCriterion | false {
    if (criterion instanceof EqualsCriterion) {
        const value = criterion.getValue();

        if (primitiveToType(value) !== shape.getValueType()) {
            return false;
        }

        return new ReshapedCriterion([new InRangeCriterion(value as number | string, value as number | string)]);
    } else if (criterion instanceof InRangeCriterion) {
        if (shape.getValueType() !== criterion.getValueType()) {
            return false;
        }

        return new ReshapedCriterion([criterion]);
    }

    return false;
}

function reshapeByEntity(shape: EntityCriterionShape, criterion: Criterion): ReshapedCriterion | false {
    if (!(criterion instanceof EntityCriterion)) {
        return false;
    }

    const criteria = criterion.getCriteria();
    const criteriaToPermutate: Record<string, Criterion[]> = {};
    const openCriteria: Record<string, Criterion[]> = {};

    for (const [key, criterionShape] of Object.entries(shape.getRequiredShapes())) {
        const criterion = criteria[key];

        if (criterion === undefined) {
            return false;
        }

        const reshaped = reshapeCriterion(criterionShape, criterion);

        if (reshaped === false) {
            return false;
        }

        criteriaToPermutate[key] = reshaped.getReshaped().slice();

        if (reshaped.getOpen().length) {
            openCriteria[key] = reshaped.getOpen().slice();
        }
    }

    for (const [key, criterionShape] of Object.entries(shape.getOptionalShapes() ?? {})) {
        const criterion = criteria[key];

        if (criterion === undefined) {
            continue;
        }

        const reshaped = reshapeCriterion(criterionShape, criterion);

        if (reshaped === false || reshaped.getOpen().length) {
            continue;
        }

        criteriaToPermutate[key] = reshaped.getReshaped().slice();
    }

    if (!Object.keys(criteriaToPermutate).length && Object.keys(shape.getRequiredShapes()).length) {
        return false;
    }

    const reshaped = permutateEntries(criteriaToPermutate).map(criterion => new EntityCriterion(criterion));

    const open = Object.entries(openCriteria).map(
        ([key, openCriteria]) => new EntityCriterion({ ...criteria, [key]: new OrCriterion(openCriteria) }),
    );

    return new ReshapedCriterion(reshaped, open);
}

function reshapeByOr(orShape: OrCriterionShape, criterion: Criterion): ReshapedCriterion | false {
    let reshaped: Criterion[] = [];

    const addToReshaped = (criterion: Criterion) => {
        reshaped = reshaped.filter(item => subtractCriterion(item, criterion) !== true);
        reshaped.push(criterion);
    };

    for (const shape of orShape.getShapes()) {
        const result = reshapeCriterion([shape], criterion);

        if (result === false) {
            continue;
        }

        for (const item of result.getReshaped()) {
            addToReshaped(item);
        }

        if (result.getOpen().length === 0) {
            return new ReshapedCriterion([new OrCriterion(reshaped)]);
        }

        criterion = new OrCriterion(result.getOpen());
    }

    if (reshaped.length > 0) {
        return new ReshapedCriterion([new OrCriterion(reshaped)], [criterion]);
    }

    return false;
}

function reshapeOrCriterion(shapes: CriterionShape[], criterion: OrCriterion): ReshapedCriterion | false {
    const reshaped: Criterion[] = [];
    const open: Criterion[] = [];

    for (const item of criterion.getCriteria()) {
        const result = reshapeCriterion(shapes, item);

        if (result === false) {
            open.push(item);
        } else {
            reshaped.push(...result.getReshaped());
            open.push(...result.getOpen());
        }
    }

    return reshaped.length ? new ReshapedCriterion(reshaped, open) : false;
}

type Reshaper<T> = (shape: T, criterion: Criterion) => ReshapedCriterion | false;

type Reshapers = {
    [K in InstanceType<AllCriterionShapeTypes>["type"]]: Reshaper<
        Extract<InstanceType<AllCriterionShapeTypes>, Record<"type", K>>
    >;
};

const reshapers: Reshapers = {
    and: () => {
        // [todo] implement
        throw new Error("not yet implemented");
    },
    entity: reshapeByEntity,
    equals: reshapeByEquals,
    "in-array": reshapeByInArray,
    "in-range": reshapeByInRange,
    "not-equals": reshapeByNotEquals,
    "not-in-array": reshapeByNotInArray,
    or: reshapeByOr,
};

export function reshapeCriterion<T extends CriterionShape[]>(
    shapes: T,
    criterion: Criterion,
): ReshapedCriterion<InstanceType<ReturnType<T[number]["getCriterionType"]>>> | false {
    if (criterion instanceof OrCriterion) {
        return reshapeOrCriterion(shapes, criterion) as
            | false
            | ReshapedCriterion<InstanceType<ReturnType<T[number]["getCriterionType"]>>>;
    } else if (criterion instanceof AndCriterion) {
        throw new Error(`reshaping ${AndCriterion.name} not yet implemented`);
    }

    for (const shape of shapes) {
        const type = shape.type;

        if (type in reshapers) {
            const reshaped = (reshapers[type as keyof Reshapers] as Reshaper<CriterionShape>)(shape, criterion) as
                | ReshapedCriterion<InstanceType<ReturnType<T[number]["getCriterionType"]>>>
                | false;

            if (reshaped !== false) {
                return reshaped;
            }
        } else {
            throw new Error(`unknown criterion shape type: ${type}`);
        }
    }

    return false;
}

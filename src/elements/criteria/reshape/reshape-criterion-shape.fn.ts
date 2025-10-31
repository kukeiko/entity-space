import { Primitive } from "@entity-space/utils";
import { partition } from "lodash";
import { AllCriterionShapeTypes } from "../all-criterion-shape-types";
import { AndCriterionShape } from "../and-criterion-shape";
import { CriterionShape } from "../criterion-shape";
import { EntityCriterionShape } from "../entity-criterion-shape";
import { EqualsCriterionShape } from "../equals-criterion-shape";
import { InArrayCriterionShape } from "../in-array-criterion-shape";
import { InRangeCriterionShape } from "../in-range-criterion-shape";
import { NotEqualsCriterionShape } from "../not-equals-criterion-shape";
import { NotInArrayCriterionShape } from "../not-in-array-criterion-shape";
import { OrCriterionShape } from "../or-criterion-shape";
import { ReshapedCriterionShape } from "../reshaped-criterion-shape";

function reshapeByEquals(
    what: CriterionShape,
    by: EqualsCriterionShape,
): ReshapedCriterionShape<EqualsCriterionShape> | false {
    if (what instanceof EqualsCriterionShape) {
        const myTypes = new Set(by.getValueTypes());
        const otherTypes = what.getValueTypes();
        const matchingTypes = otherTypes.filter(valueType => myTypes.has(valueType));

        if (matchingTypes.length === otherTypes.length) {
            return new ReshapedCriterionShape(by);
        } else if (matchingTypes.length) {
            const missingTypes = otherTypes.filter(valueType => !myTypes.has(valueType));
            return new ReshapedCriterionShape(by, new EqualsCriterionShape(missingTypes));
        }
    } else if (what instanceof InArrayCriterionShape) {
        const myTypes = new Set(by.getValueTypes());
        const matchingTypes = Array.from(what.getValueTypes()).filter(valueType => myTypes.has(valueType));

        if (matchingTypes.length) {
            const openTypes = Array.from(what.getValueTypes()).filter(valueType => !myTypes.has(valueType));
            const open = openTypes.length ? new InArrayCriterionShape(openTypes) : undefined;

            return new ReshapedCriterionShape(by, open, 1);
        }
    }

    return false;
}

function reshapeByInArray(
    what: CriterionShape,
    by: InArrayCriterionShape,
): ReshapedCriterionShape<InArrayCriterionShape> | false {
    if (what instanceof InArrayCriterionShape || what instanceof EqualsCriterionShape) {
        const [matchingTypes, openTypes] = partition(what.getValueTypes(), valueType =>
            by.getValueTypes().includes(valueType),
        ) as [Primitive[], Primitive[]];

        if (!matchingTypes.length) {
            return false;
        }

        const reshaped = new InArrayCriterionShape(matchingTypes);
        let open: CriterionShape | undefined;

        if (openTypes.length) {
            if (what instanceof InArrayCriterionShape) {
                open = new InArrayCriterionShape(openTypes);
            } else {
                open = new EqualsCriterionShape(openTypes);
            }
        }

        return new ReshapedCriterionShape(reshaped, open);
    }

    return false;
}

function reshapeByNotEquals(
    what: CriterionShape,
    by: NotEqualsCriterionShape,
): ReshapedCriterionShape<NotEqualsCriterionShape> | false {
    if (what instanceof NotEqualsCriterionShape) {
        const myTypes = new Set(by.getValueTypes());
        const otherTypes = what.getValueTypes();
        const matchingTypes = otherTypes.filter(valueType => myTypes.has(valueType));

        if (matchingTypes.length === otherTypes.length) {
            return new ReshapedCriterionShape(by);
        } else if (matchingTypes.length) {
            const missingTypes = otherTypes.filter(valueType => !myTypes.has(valueType));
            return new ReshapedCriterionShape(by, new NotEqualsCriterionShape(missingTypes));
        }
    } else if (what instanceof NotInArrayCriterionShape) {
        const myTypes = new Set(by.getValueTypes());
        const matchingTypes = Array.from(what.getValueTypes()).filter(valueType => myTypes.has(valueType));

        if (matchingTypes.length) {
            const openTypes = Array.from(what.getValueTypes()).filter(valueType => !myTypes.has(valueType));
            const open = openTypes.length ? new NotInArrayCriterionShape(openTypes) : undefined;

            return new ReshapedCriterionShape(by, open);
        }
    }

    return false;
}

function reshapeByNotInArray(
    what: CriterionShape,
    by: NotInArrayCriterionShape,
): ReshapedCriterionShape<NotInArrayCriterionShape> | false {
    if (what instanceof NotInArrayCriterionShape || what instanceof NotEqualsCriterionShape) {
        const [matchingTypes, openTypes] = partition(what.getValueTypes(), valueType =>
            by.getValueTypes().includes(valueType),
        ) as [Primitive[], Primitive[]];

        if (!matchingTypes.length) {
            return false;
        }

        const reshaped = new NotInArrayCriterionShape(matchingTypes);
        let open: CriterionShape | undefined;

        if (openTypes.length) {
            if (what instanceof NotInArrayCriterionShape) {
                open = new NotInArrayCriterionShape(openTypes);
            } else {
                open = new NotEqualsCriterionShape(openTypes);
            }
        }

        return new ReshapedCriterionShape(reshaped, open);
    }

    return false;
}

function reshapeByInRange(
    what: CriterionShape,
    by: InRangeCriterionShape,
): ReshapedCriterionShape<InRangeCriterionShape> | false {
    if (what instanceof InRangeCriterionShape && what.getValueType() === by.getValueType()) {
        return new ReshapedCriterionShape(by);
    }

    return false;
}

function reshapeByEntity(
    what: CriterionShape,
    by: EntityCriterionShape,
): ReshapedCriterionShape<EntityCriterionShape> | false {
    if (!(what instanceof EntityCriterionShape)) {
        return false;
    }

    const reshapedShapes: Record<string, CriterionShape> = {};
    const openShapes: Record<string, CriterionShape[]> = {};
    const otherRequiredShapes = what.getRequiredShapes();
    let flattenCount = 0;

    for (const [key, shape] of Object.entries(by.getRequiredShapes())) {
        const otherShapes = otherRequiredShapes[key];

        if (otherShapes === undefined) {
            return false;
        }

        let reshaped: ReshapedCriterionShape | false = false;

        for (const otherShape of otherShapes) {
            reshaped = reshapeCriterionShape(otherShape, shape);

            if (reshaped !== false) {
                break;
            }
        }

        if (!reshaped) {
            return false;
        }

        reshapedShapes[key] = reshaped.getReshaped();
        flattenCount += reshaped.getFlattenCount();
        const openReshaped = reshaped.getOpen();

        if (openReshaped) {
            openShapes[key] = [...(openShapes[key] ?? []), openReshaped];
        }
    }

    const open = Object.fromEntries(
        Object.entries(openShapes).map(([key, openShape]) => [key, new OrCriterionShape(openShape)]),
    );

    if (Object.keys(open).length) {
        return new ReshapedCriterionShape(
            new EntityCriterionShape(reshapedShapes),
            new EntityCriterionShape(open),
            flattenCount,
        );
    } else {
        return new ReshapedCriterionShape(new EntityCriterionShape(reshapedShapes), undefined, flattenCount);
    }
}

function reshapeOrCriterionShape(self: CriterionShape[], orShape: OrCriterionShape): ReshapedCriterionShape | false {
    let reshaped: CriterionShape | undefined;
    const open: CriterionShape[] = [];
    let flattenCount = 0;

    for (const item of orShape.getShapes()) {
        const result = reshapeCriterionShape(item, self);

        if (result === false || reshaped) {
            open.push(item);
        } else {
            reshaped = result.getReshaped();
            flattenCount += result.getFlattenCount();
            const openShape = result.getOpen();

            if (openShape) {
                open.push(openShape);
            }
        }
    }

    if (reshaped) {
        if (open.length) {
            return new ReshapedCriterionShape(reshaped, new OrCriterionShape(open), flattenCount);
        } else {
            return new ReshapedCriterionShape(reshaped, undefined, flattenCount);
        }
    }

    return false;
}

type Reshaper<T extends CriterionShape> = (what: CriterionShape, by: T) => ReshapedCriterionShape<T> | false;

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
    equals: reshapeByEquals,
    entity: reshapeByEntity,
    "in-array": reshapeByInArray,
    "not-equals": reshapeByNotEquals,
    "not-in-array": reshapeByNotInArray,
    "in-range": reshapeByInRange,
    or: () => {
        // [todo] implement
        throw new Error("not yet implemented");
    },
};

export function reshapeCriterionShape<T extends CriterionShape[]>(
    what: CriterionShape,
    by: T,
): ReshapedCriterionShape<T[number]> | false {
    if (what instanceof OrCriterionShape) {
        return reshapeOrCriterionShape(by, what) as ReshapedCriterionShape<T[number]> | false;
    } else if (what instanceof AndCriterionShape) {
        /**
         * (A&B) | (C&D) => A&B | C&D
         * (A|B) & (C|D) => A&C | A&D | B&C | B&D
         * A = (0|1) & (2|3)
         * (((0|1) & (2|3)) | B) & (C|D) => 0&2&C | 0&3&C | 1&2&C | 1&3&C | 0&2&D | 0&3&D | 1&2&D | 1&3&D | B&C | B&D
         */
        throw new Error(`reshaping ${AndCriterionShape.name} not yet implemented`);
    }

    for (const byShape of by) {
        const type = byShape.type;

        if (type in reshapers) {
            const reshaped = (reshapers[type as keyof Reshapers] as unknown as Reshaper<T[number]>)(what, byShape);

            if (reshaped !== false) {
                return reshaped;
            }
        } else {
            throw new Error(`unknown criterion shape type: ${type}`);
        }
    }

    return false;
}

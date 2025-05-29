import { permutateEntries } from "@entity-space/utils";
import { Criterion } from "../criteria/criterion";
import { EntityCriterionShape } from "../criteria/entity-criterion-shape";
import { reshapeCriterion } from "../criteria/reshape/reshape-criterion.fn";
import { EntitySelection } from "../selection/entity-selection";
import { intersectSelection } from "../selection/intersect-selection.fn";
import { EntityQuery } from "./entity-query";
import { EntityQueryShape } from "./entity-query-shape";

interface ReshapedParts {
    criterion?: Criterion[] | false;
    selection: EntitySelection | false;
}

type WithoutFalse<T> = {
    [K in keyof T]: Exclude<T[K], false>;
};

function containsNoFalse(parts: ReshapedParts): parts is WithoutFalse<ReshapedParts> {
    return Object.values(parts).every(part => part !== false);
}

function reshapeQueryCriterion(shape: EntityQueryShape, query: EntityQuery): Criterion[] | false | undefined {
    const criterion = query.getCriterion();
    const criterionShape = shape.getCriterionShape();

    if (criterionShape === undefined) {
        return undefined;
    } else if (criterion === undefined) {
        if (criterionShape instanceof EntityCriterionShape && !Object.keys(criterionShape.getRequiredShapes()).length) {
            return undefined;
        } else {
            return false;
        }
    }

    const reshaped = reshapeCriterion([criterionShape], criterion);

    return reshaped ? reshaped.getReshaped().slice() : false;
}

export function reshapeQuery(shape: EntityQueryShape, query: EntityQuery): EntityQuery[] | false {
    if (shape.getSchema().getName() !== query.getSchema().getName()) {
        return false;
    } else if (shape.getParametersSchema()?.getName() !== query.getParameters()?.getSchema()?.getName()) {
        return false;
    }

    const reshapedParts: ReshapedParts = {
        criterion: reshapeQueryCriterion(shape, query),
        selection: intersectSelection(shape.getUnpackedSelection(), query.getSelection()),
    };

    if (!containsNoFalse(reshapedParts)) {
        return false;
    }

    return permutateEntries(reshapedParts).map(
        parts => new EntityQuery(shape.getSchema(), parts.selection, parts.criterion, query.getParameters()),
    );
}

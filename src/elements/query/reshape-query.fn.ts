import { permutateEntries } from "@entity-space/utils";
import { Criterion } from "../criteria/criterion";
import { CriterionShape } from "../criteria/criterion-shape";
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

export function reshapeQuery(shape: EntityQueryShape, query: EntityQuery): EntityQuery[] | false {
    if (shape.getSchema().getName() !== query.getSchema().getName()) {
        return false;
    } else if (shape.getParametersSchema()?.getName() !== query.getParameters()?.getSchema()?.getName()) {
        return false;
    }

    const criterion = query.getCriterion();
    const criterionShape = shape.getCriterionShape();

    if (criterion === undefined && criterionShape !== undefined) {
        return false;
    }

    const reshapeQueryCriterion = (criterion: Criterion, shape: CriterionShape): false | Criterion[] => {
        const reshaped = reshapeCriterion([shape], criterion);

        return reshaped ? reshaped.getReshaped().slice() : false;
    };

    const reshapedParts: ReshapedParts = {
        criterion: criterion && criterionShape ? reshapeQueryCriterion(criterion, criterionShape) : undefined,
        selection: intersectSelection(shape.getSelection(), query.getSelection()),
    };

    if (!containsNoFalse(reshapedParts)) {
        return false;
    }

    return permutateEntries(reshapedParts).map(
        parts => new EntityQuery(shape.getSchema(), parts.selection, parts.criterion, query.getParameters()),
    );
}

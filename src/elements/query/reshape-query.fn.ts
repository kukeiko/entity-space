import { permutateEntries } from "@entity-space/utils";
import { Criterion } from "../criteria/criterion";
import { EntityCriterionShape } from "../criteria/entity-criterion-shape";
import { reshapeCriterion } from "../criteria/reshape/reshape-criterion.fn";
import { EntitySort } from "../entity/entity-sort";
import { intersectSelection } from "../selection/intersect-selection.fn";
import { EntityPage } from "./entity-page";
import { EntityPageShape } from "./entity-page-shape";
import { EntityQuery } from "./entity-query";
import { EntityQueryShape } from "./entity-query-shape";
import { EntitySortShape } from "./entity-sort-shape";

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

function reshapeSort(sort?: EntitySort, shape?: EntitySortShape): EntitySort | undefined {
    if (sort !== undefined && shape !== undefined && shape.includesSortableProperties(sort.getPropertyPaths())) {
        return sort;
    }

    return undefined;
}

function reshapePage(page?: EntityPage, shape?: EntityPageShape): EntityPage | false | undefined {
    if (page === undefined && shape !== undefined && shape.isRequired()) {
        return false;
    } else if (page !== undefined && shape === undefined) {
        return undefined;
    }

    return page;
}

export function reshapeQuery(query: EntityQuery, shape: EntityQueryShape): EntityQuery[] | false {
    if (shape.getSchema().getName() !== query.getSchema().getName()) {
        return false;
    } else if (shape.getParametersSchema()?.getName() !== query.getParameters()?.getSchema()?.getName()) {
        return false;
    }

    const sort = reshapeSort(query.getSort(), shape.getSortShape());
    const page = reshapePage(query.getPage(), shape.getPageShape());

    if (page === false) {
        return false;
    } else if (page !== undefined && sort === undefined) {
        return false;
    }

    const criterion = reshapeQueryCriterion(shape, query);

    if (criterion === false) {
        return false;
    } else if (page !== undefined && criterion !== undefined && criterion.length > 1) {
        return false;
    }

    const selection = intersectSelection(shape.getUnpackedSelection(), query.getSelection());

    if (selection === false) {
        return false;
    }

    return permutateEntries({ criterion, selection, sort, page }).map(
        parts =>
            new EntityQuery(
                shape.getSchema(),
                parts.selection,
                parts.criterion,
                query.getParameters(),
                parts.sort,
                parts.page,
            ),
    );
}

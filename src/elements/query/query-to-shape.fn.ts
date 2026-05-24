import { criterionToShape } from "../criteria/functions/criterion-to-shape.fn";
import { EntityPageShape } from "./entity-page-shape";
import { EntityQuery } from "./entity-query";
import { EntityQueryShape } from "./entity-query-shape";
import { EntitySortShape } from "./entity-sort-shape";

export function queryToShape(query: EntityQuery): EntityQueryShape {
    const criterion = query.getCriterion();
    const sort = query.getSort();
    const page = query.getPage();

    return new EntityQueryShape(
        query.getSchema(),
        query.getSelection(),
        criterion ? criterionToShape(criterion) : undefined,
        query.getParameters()?.getSchema(),
        sort ? new EntitySortShape(sort.getPropertyPaths()) : undefined,
        page ? new EntityPageShape() : undefined,
    );
}

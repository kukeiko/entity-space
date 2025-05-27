import { criterionToShape } from "../criteria/functions/criterion-to-shape.fn";
import { EntityQuery } from "./entity-query";
import { EntityQueryShape } from "./entity-query-shape";

export function queryToShape(query: EntityQuery): EntityQueryShape {
    const criterion = query.getCriterion();

    return new EntityQueryShape(
        query.getSchema(),
        query.getSelection(),
        criterion ? criterionToShape(criterion) : undefined,
        query.getParameters()?.getSchema(),
    );
}

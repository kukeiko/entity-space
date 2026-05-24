import { EntityCriterionShape } from "../criteria/entity-criterion-shape";
import { reshapeCriterionShape } from "../criteria/reshape/reshape-criterion-shape.fn";
import { ReshapedCriterionShape } from "../criteria/reshaped-criterion-shape";
import { intersectSelection } from "../selection/intersect-selection.fn";
import { packEntitySelection } from "../selection/pack-entity-selection.fn";
import { subtractSelection } from "../selection/subtract-selection.fn";
import { EntityPageShape } from "./entity-page-shape";
import { EntityQueryShape } from "./entity-query-shape";
import { EntitySortShape } from "./entity-sort-shape";
import { ReshapedEntityQueryShape } from "./reshaped-entity-query-shape";

function reshapeQueryCriterionShape(
    what: EntityQueryShape,
    by: EntityQueryShape,
): ReshapedCriterionShape | false | undefined {
    const whatCriterionShape = what.getCriterionShape();
    const byCriterionShape = by.getCriterionShape();

    if (!whatCriterionShape) {
        if (!byCriterionShape) {
            return undefined;
        } else if (
            byCriterionShape instanceof EntityCriterionShape &&
            !Object.keys(byCriterionShape.getRequiredShapes()).length
        ) {
            return new ReshapedCriterionShape(byCriterionShape);
        } else {
            return false;
        }
    } else if (!byCriterionShape) {
        return undefined;
    }

    return reshapeCriterionShape(whatCriterionShape, [byCriterionShape]);
}

function reshapeSortShape(what?: EntitySortShape, into?: EntitySortShape): EntitySortShape | undefined {
    if (what !== undefined && into !== undefined && into.includesSortableProperties(what.getSortableProperties())) {
        return what;
    }

    return undefined;
}

function reshapePageShape(what?: EntityPageShape, into?: EntityPageShape): EntityPageShape | false | undefined {
    if (what === undefined && into !== undefined && into.isRequired()) {
        return false;
    } else if (what !== undefined && into === undefined) {
        return undefined;
    }

    return what;
}

export function reshapeQueryShape(what: EntityQueryShape, into: EntityQueryShape): ReshapedEntityQueryShape | false {
    if (what.getSchema().getName() !== into.getSchema().getName()) {
        return false;
    } else if (what.getParametersSchema()?.getName() !== into.getParametersSchema()?.getName()) {
        return false;
    } else if (what.getPageShape() === undefined && into.getPageShape()?.isRequired()) {
        return false;
    }

    const reshapedCriterionShape = reshapeQueryCriterionShape(what, into);

    if (reshapedCriterionShape === false) {
        return false;
    }

    const sortShape = reshapeSortShape(what.getSortShape(), into.getSortShape());
    const pageShape = reshapePageShape(what.getPageShape(), into.getPageShape());

    if (pageShape === false) {
        return false;
    } else if (pageShape !== undefined && sortShape === undefined) {
        return false;
    }

    let openForCriteria: EntityQueryShape | undefined;

    if (reshapedCriterionShape !== undefined) {
        const openCriterionShape = reshapedCriterionShape.getOpen();

        if (openCriterionShape !== undefined) {
            if (pageShape !== undefined) {
                return false;
            }

            openForCriteria = new EntityQueryShape(
                what.getSchema(),
                what.getSelection(),
                openCriterionShape,
                what.getParametersSchema(),
                sortShape,
                pageShape,
            );
        }
    }

    const intersectedSelection = intersectSelection(what.getUnpackedSelection(), into.getUnpackedSelection());

    if (intersectedSelection === false) {
        return false;
    }

    const openSelection = subtractSelection(what.getUnpackedSelection(), intersectedSelection);
    let openForSelection: EntityQueryShape | undefined;

    if (typeof openSelection !== "boolean") {
        openForSelection = new EntityQueryShape(
            what.getSchema(),
            packEntitySelection(what.getSchema(), openSelection),
            what.getCriterionShape(),
            what.getParametersSchema(),
            sortShape,
            pageShape,
        );
    }

    return new ReshapedEntityQueryShape(
        new EntityQueryShape(
            what.getSchema(),
            intersectedSelection,
            reshapedCriterionShape?.getReshaped(),
            what.getParametersSchema(),
            sortShape,
            pageShape,
        ),
        openForCriteria,
        openForSelection,
        reshapedCriterionShape?.getFlattenCount(),
    );
}

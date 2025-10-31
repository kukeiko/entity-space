import { EntityCriterionShape } from "../criteria/entity-criterion-shape";
import { reshapeCriterionShape } from "../criteria/reshape/reshape-criterion-shape.fn";
import { ReshapedCriterionShape } from "../criteria/reshaped-criterion-shape";
import { intersectSelection } from "../selection/intersect-selection.fn";
import { packEntitySelection } from "../selection/pack-entity-selection.fn";
import { subtractSelection } from "../selection/subtract-selection.fn";
import { EntityQueryShape } from "./entity-query-shape";
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

export function reshapeQueryShape(what: EntityQueryShape, by: EntityQueryShape): ReshapedEntityQueryShape | false {
    if (what.getSchema().getName() !== by.getSchema().getName()) {
        return false;
    } else if (what.getParametersSchema()?.getName() !== by.getParametersSchema()?.getName()) {
        return false;
    }

    const reshapedCriterionShape = reshapeQueryCriterionShape(what, by);

    if (reshapedCriterionShape === false) {
        return false;
    }

    let openForCriteria: EntityQueryShape | undefined;

    if (reshapedCriterionShape !== undefined) {
        const openCriterionShape = reshapedCriterionShape.getOpen();

        if (openCriterionShape !== undefined) {
            openForCriteria = new EntityQueryShape(
                what.getSchema(),
                what.getSelection(),
                openCriterionShape,
                what.getParametersSchema(),
            );
        }
    }

    const intersectedSelection = intersectSelection(what.getUnpackedSelection(), by.getUnpackedSelection());

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
        );
    }

    return new ReshapedEntityQueryShape(
        new EntityQueryShape(
            what.getSchema(),
            intersectedSelection,
            reshapedCriterionShape?.getReshaped(),
            what.getParametersSchema(),
        ),
        openForCriteria,
        openForSelection,
        reshapedCriterionShape?.getFlattenCount()
    );
}

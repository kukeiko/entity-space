import { EntitySelection } from "../../selection/entity-selection";
import { mergeSelections } from "../../selection/merge-selections.fn";
import { AndCriterionShape } from "../and-criterion-shape";
import { CriterionShape } from "../criterion-shape";
import { EntityCriterionShape } from "../entity-criterion-shape";
import { OrCriterionShape } from "../or-criterion-shape";
import { SomeCriterionShape } from "../some-criterion-shape";

export function criterionShapeToSelection(shape: CriterionShape): EntitySelection {
    if (shape instanceof EntityCriterionShape) {
        const selection: EntitySelection = {};

        for (const [key, childShapes] of Object.entries(shape.getRequiredShapes())) {
            let selectedValue: EntitySelection | true = mergeSelections(
                childShapes.map(childShape => criterionShapeToSelection(childShape)),
            );

            selectedValue = Object.keys(selectedValue).length ? selectedValue : true;

            if (selection[key]) {
                if (selectedValue !== true) {
                    selection[key] =
                        selection[key] === true ? selectedValue : mergeSelections([selection[key], selectedValue]);
                }
            } else {
                selection[key] = selectedValue;
            }
        }

        return selection;
    } else if (shape instanceof SomeCriterionShape) {
        return criterionShapeToSelection(shape.getShape());
    } else if (shape instanceof OrCriterionShape || shape instanceof AndCriterionShape) {
        return mergeSelections(shape.getShapes().map(nestedShape => criterionShapeToSelection(nestedShape)));
    } else {
        return {};
    }
}

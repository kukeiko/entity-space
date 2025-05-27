import { primitiveToType } from "@entity-space/utils";
import { Criterion } from "../criterion";
import { CriterionShape } from "../criterion-shape";
import { EntityCriterion } from "../entity-criterion";
import { EntityCriterionShape, PackedEntityCriterionShape } from "../entity-criterion-shape";
import { EqualsCriterion } from "../equals-criterion";
import { EqualsCriterionShape } from "../equals-criterion-shape";
import { InArrayCriterion } from "../in-array-criterion";
import { InArrayCriterionShape } from "../in-array-criterion-shape";
import { InRangeCriterion } from "../in-range-criterion";
import { InRangeCriterionShape } from "../in-range-criterion-shape";

export function criterionToShape(criterion: Criterion): CriterionShape {
    if (criterion instanceof EntityCriterion) {
        const bag: PackedEntityCriterionShape = {};

        for (const [key, value] of Object.entries(criterion.getCriteria())) {
            bag[key] = criterionToShape(value);
        }

        return new EntityCriterionShape(bag);
    } else if (criterion instanceof EqualsCriterion) {
        return new EqualsCriterionShape([primitiveToType(criterion.getValue())]);
    } else if (criterion instanceof InArrayCriterion) {
        return new InArrayCriterionShape(criterion.getValues().map(primitiveToType));
    } else if (criterion instanceof InRangeCriterion) {
        return new InRangeCriterionShape(criterion.getValueType());
    } else {
        throw new Error(`not yet implemented`);
    }
}

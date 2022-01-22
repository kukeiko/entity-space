import { Criterion } from "../criterion";
import { CriterionTemplate } from "../criterion-template.types";
import { OrCriteria, OrCriteriaTemplate } from "../or";
import { InNumberRangeCriterion } from "../range";
import { IsNumberValueCriterion } from "../value";
import { InSetCriterion } from "./in-set-criterion";
import { NotInNumberSetCriterion } from "./not-in-number-set-criterion";

export class InNumberSetCriterion extends InSetCriterion<number> {
    inRangeClass = InNumberRangeCriterion;
    notInClass = NotInNumberSetCriterion;

    override remapOne(template: CriterionTemplate): [false, undefined] | [Criterion[], Criterion?] {
        if (template === InNumberSetCriterion) {
            return [[this]];
        } else if (template === IsNumberValueCriterion) {
            return [Array.from(this.values).map(value => new IsNumberValueCriterion(value))];
        } else if (
            template instanceof OrCriteriaTemplate &&
            template.items.some(item => item === IsNumberValueCriterion)
        ) {
            return [[new OrCriteria(Array.from(this.values).map(value => new IsNumberValueCriterion(value)))]];
        }

        return [false, void 0];
    }
}

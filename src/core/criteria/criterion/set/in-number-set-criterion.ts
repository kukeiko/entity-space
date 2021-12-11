import { InNumberRangeCriterion } from "../range";
import { NotInNumberSetCriterion } from "./not-in-number-set-criterion";
import { InSetCriterion } from "./in-set-criterion";
import { CriterionTemplate } from "../criterion-template.types";
import { Criterion } from "../criterion";
import { IsNumberValueCriterion } from "../value";
import { OrCriteria, OrCriteriaTemplate } from "../or";

export class InNumberSetCriterion extends InSetCriterion<number> {
    inRangeClass = InNumberRangeCriterion;
    notInClass = NotInNumberSetCriterion;

    remapOne(template: CriterionTemplate): [false, undefined] | [Criterion[], Criterion?] {
        if (template === InNumberSetCriterion) {
            return [[this]];
        } else if (template === IsNumberValueCriterion) {
            return [Array.from(this.values).map(value => new IsNumberValueCriterion(value))];
        } else if (template instanceof OrCriteriaTemplate && template.items.some(item => item === IsNumberValueCriterion)) {
            return [[new OrCriteria(Array.from(this.values).map(value => new IsNumberValueCriterion(value)))]];
        }

        return [false, void 0];
    }
}

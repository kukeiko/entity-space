import { ICriterionShape, ICriterionShape$ } from "../criterion-shape.interface";
import { ICriterion } from "../criterion.interface";
import { IEntityCriteriaTools } from "../entity-criteria-tools.interface";
import { ReshapedCriterion } from "../reshaped-criterion";
import { INeverCriterion } from "./never-criterion.interface";

export class NeverCriterionShape implements ICriterionShape<INeverCriterion, INeverCriterion> {
    constructor({ tools }: { tools: IEntityCriteriaTools }) {
        this.tools = tools;
    }

    readonly [ICriterionShape$] = true;
    private readonly tools: IEntityCriteriaTools;

    reshape(criterion: ICriterion): false | ReshapedCriterion<INeverCriterion> {
        if (this.tools.isNeverCriterion(criterion)) {
            return new ReshapedCriterion([criterion]);
        }

        return false;
    }

    toString(): string {
        return "none";
    }
}

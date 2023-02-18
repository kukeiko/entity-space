import { ICriterionShape, ICriterionShape$ } from "../criterion-shape.interface";
import { ICriterion } from "../criterion.interface";
import { IEntityCriteriaTools } from "../entity-criteria-tools.interface";
import { ReshapedCriterion } from "../reshaped-criterion";
import { INoneCriterion } from "./none-criterion.interface";

export class NoneCriterionShape implements ICriterionShape<INoneCriterion, INoneCriterion> {
    constructor({ tools }: { tools: IEntityCriteriaTools }) {
        this.tools = tools;
    }

    readonly [ICriterionShape$] = true;
    private readonly tools: IEntityCriteriaTools;

    read(criterion: INoneCriterion): INoneCriterion {
        return criterion;
    }

    reshape(criterion: ICriterion): false | ReshapedCriterion<INoneCriterion> {
        if (this.tools.isNoneCriterion(criterion)) {
            return new ReshapedCriterion([criterion]);
        }

        return false;
    }

    toString(): string {
        return "none";
    }
}

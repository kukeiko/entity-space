import { ICriterionShape, ICriterionShape$ } from "../criterion-shape.interface";
import { ICriterion } from "../criterion.interface";
import { IEntityCriteriaTools } from "../entity-criteria-tools.interface";
import { ReshapedCriterion } from "../reshaped-criterion";
import { IAllCriterion } from "./all-criterion.interface";

export class AllCriterionShape implements ICriterionShape<IAllCriterion, IAllCriterion> {
    constructor({ tools }: { tools: IEntityCriteriaTools }) {
        this.tools = tools;
    }

    readonly [ICriterionShape$] = true;
    private readonly tools: IEntityCriteriaTools;

    read(criterion: IAllCriterion): IAllCriterion {
        return criterion;
    }

    reshape(criterion: ICriterion): false | ReshapedCriterion<IAllCriterion> {
        if (this.tools.isAllCriterion(criterion)) {
            return new ReshapedCriterion([criterion]);
        }

        return false;
    }

    toString(): string {
        return "all";
    }
}

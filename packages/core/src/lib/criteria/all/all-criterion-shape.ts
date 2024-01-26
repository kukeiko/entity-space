import { ICriterionShape, ICriterionShape$ } from "../criterion-shape.interface";
import { ICriterion } from "../criterion.interface";
import { IEntityCriteriaTools } from "../entity-criteria-tools.interface";
import { ReshapedCriterion } from "../reshaped-criterion";
import { IAllCriterion } from "./all-criterion.interface";

export class AllCriterionShape implements ICriterionShape<IAllCriterion> {
    constructor({ tools }: { tools: IEntityCriteriaTools }) {
        this.tools = tools;
    }

    readonly [ICriterionShape$] = true;
    private readonly tools: IEntityCriteriaTools;

    reshape(_: ICriterion): false | ReshapedCriterion<IAllCriterion> {
        return new ReshapedCriterion([this.tools.all()]);
    }

    toString(): string {
        return "all";
    }
}

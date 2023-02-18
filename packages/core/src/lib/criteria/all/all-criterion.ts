import { CriterionBase } from "../criterion-base";
import { ICriterion, ICriterion$ } from "../criterion.interface";
import { IEntityCriteriaTools } from "../entity-criteria-tools.interface";
import { IAllCriterion, IAllCriterion$ } from "./all-criterion.interface";

export class AllCriterion extends CriterionBase implements IAllCriterion {
    constructor({ tools }: { tools: IEntityCriteriaTools }) {
        super();
        this.tools = tools;
    }

    readonly [ICriterion$] = true;
    readonly [IAllCriterion$] = true;
    private readonly tools: IEntityCriteriaTools;

    equivalent(other: ICriterion): boolean {
        return this.subtractFrom(other) === true && other.subtractFrom(this) === true;
    }

    intersect(other: ICriterion): false | ICriterion {
        return other;
    }

    invert(): false | ICriterion {
        return this.tools.none();
    }

    contains(_: unknown): boolean {
        return true;
    }

    merge(_: ICriterion): false | ICriterion {
        return this;
    }

    minus(by: ICriterion): boolean | ICriterion {
        return by.invert();
    }

    subtractFrom(_: ICriterion): boolean | ICriterion {
        return true;
    }

    override toString(): string {
        return "all";
    }
}

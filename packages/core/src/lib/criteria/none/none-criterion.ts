import { CriterionBase } from "../criterion-base";
import { ICriterion, ICriterion$ } from "../criterion.interface";
import { IEntityCriteriaTools } from "../entity-criteria-tools.interface";
import { INoneCriterion, INoneCriterion$ } from "./none-criterion.interface";

export class NoneCriterion extends CriterionBase implements INoneCriterion {
    constructor({ tools }: { tools: IEntityCriteriaTools }) {
        super();
        this.tools = tools;
    }

    readonly [ICriterion$] = true;
    readonly [INoneCriterion$] = true;
    private readonly tools: IEntityCriteriaTools;

    equivalent(other: ICriterion): boolean {
        return this.subtractFrom(other) === true && other.subtractFrom(this) === true;
    }

    intersect(_: ICriterion): false | ICriterion {
        return this;
    }

    invert(): false | ICriterion {
        return this.tools.all();
    }

    contains(_: unknown): boolean {
        return false;
    }

    merge(other: ICriterion): false | ICriterion {
        return other;
    }

    minus(by: ICriterion): boolean | ICriterion {
        return this;
    }

    subtractFrom(other: ICriterion): boolean | ICriterion {
        return other;
    }

    override toString(): string {
        return "none";
    }
}

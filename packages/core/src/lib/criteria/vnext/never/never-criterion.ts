import { CriterionBase } from "../criterion-base";
import { ICriterion, ICriterion$ } from "../criterion.interface";
import { IEntityCriteriaTools } from "../entity-criteria-tools.interface";
import { INeverCriterion, INeverCriterion$ } from "./never-criterion.interface";

export class NeverCriterion extends CriterionBase implements INeverCriterion {
    constructor({ tools }: { tools: IEntityCriteriaTools }) {
        super();
        this.tools = tools;
    }

    readonly [ICriterion$] = true;
    readonly [INeverCriterion$] = true;
    private readonly tools: IEntityCriteriaTools;

    equivalent(other: ICriterion): boolean {
        return this.subtractFrom(other) === true && other.subtractFrom(this) === true;
    }

    intersect(_: ICriterion): false | ICriterion {
        return false;
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
        return INeverCriterion.is(other);
    }

    override toString(): string {
        return "never";
    }
}

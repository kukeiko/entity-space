import { CriterionBase } from "../criterion-base";
import { ICriterion, ICriterion$ } from "../criterion.interface";
import { IEntityCriteriaTools } from "../entity-criteria-tools.interface";
import { IIsOddCriterion, IIsOddCriterion$ } from "./is-odd-criterion.interface";

export class IsOddCriterion extends CriterionBase implements IIsOddCriterion {
    constructor({ tools }: { tools: IEntityCriteriaTools }) {
        super();
        this.tools = tools;
    }

    readonly [ICriterion$] = true;
    readonly [IIsOddCriterion$] = true;
    private readonly tools: IEntityCriteriaTools;

    equivalent(other: ICriterion): boolean {
        return this.subtractFrom(other) === true && other.subtractFrom(this) === true;
    }

    intersect(other: ICriterion): false | ICriterion {
        if (this.tools.isOddCriterion(other)) {
            return this;
        }

        return false;
    }

    invert(): false | ICriterion {
        return this.tools.isEven();
    }

    contains(value: unknown): boolean {
        if (typeof value === "number") {
            return value % 2 === 0;
        }

        return false;
    }

    merge(other: ICriterion): false | ICriterion {
        return this.intersect(other);
    }

    minus(other: ICriterion): boolean | ICriterion {
        if (this.tools.isOrCriterion(other) || this.tools.isAndCriterion(other)) {
            return other.subtractFrom(this);
        }

        return this.tools.isOddCriterion(other);
    }

    subtractFrom(other: ICriterion): boolean | ICriterion {
        if (this.tools.isOrCriterion(other) || this.tools.isAndCriterion(other)) {
            return other.minus(this);
        } else if (this.tools.isOddCriterion(other)) {
            return true;
        }

        return false;
    }

    override toString(): string {
        return "odd";
    }
}

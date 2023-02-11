import { IAndCriterion } from "../and/and-criterion.interface";
import { CriterionBase } from "../criterion-base";
import { ICriterion, ICriterion$ } from "../criterion.interface";
import { IEntityCriteriaFactory } from "../entity-criteria-factory.interface";
import { IOrCriterion } from "../or/or-criterion.interface";
import { IIsOddCriterion, IIsOddCriterion$ } from "./is-odd-criterion.interface";

export class IsOddCriterion extends CriterionBase implements IIsOddCriterion {
    constructor({ factory }: { factory: IEntityCriteriaFactory }) {
        super();
        this.factory = factory;
    }

    readonly [ICriterion$] = true;
    readonly [IIsOddCriterion$] = true;
    private readonly factory: IEntityCriteriaFactory;

    equivalent(other: ICriterion): boolean {
        return this.subtractFrom(other) === true && other.subtractFrom(this) === true;
    }

    intersect(other: ICriterion): false | ICriterion {
        if (IIsOddCriterion.is(other)) {
            return this;
        }

        return false;
    }

    invert(): false | ICriterion {
        return this.factory.isEven();
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
        if (IOrCriterion.is(other) || IAndCriterion.is(other)) {
            return other.subtractFrom(this);
        }

        return IIsOddCriterion.is(other);
    }

    subtractFrom(other: ICriterion): boolean | ICriterion {
        if (IOrCriterion.is(other) || IAndCriterion.is(other)) {
            return other.minus(this);
        } else if (IIsOddCriterion.is(other)) {
            return true;
        }

        return false;
    }

    override toString(): string {
        return "odd";
    }
}

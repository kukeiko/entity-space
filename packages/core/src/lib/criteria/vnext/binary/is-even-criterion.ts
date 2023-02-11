import { IAndCriterion } from "../and/and-criterion.interface";
import { CriterionBase } from "../criterion-base";
import { ICriterion, ICriterion$ } from "../criterion.interface";
import { IEntityCriteriaFactory } from "../entity-criteria-factory.interface";
import { IOrCriterion } from "../or/or-criterion.interface";
import { IIsEvenCriterion, IIsEvenCriterion$ } from "./is-even-criterion.interface";

export class IsEvenCriterion extends CriterionBase implements IIsEvenCriterion {
    constructor({ factory }: { factory: IEntityCriteriaFactory }) {
        super();
        this.factory = factory;
    }

    readonly [ICriterion$] = true;
    readonly [IIsEvenCriterion$] = true;
    private readonly factory: IEntityCriteriaFactory;

    equivalent(other: ICriterion): boolean {
        return this.subtractFrom(other) === true && other.subtractFrom(this) === true;
    }

    intersect(other: ICriterion): false | ICriterion {
        if (IIsEvenCriterion.is(other)) {
            return this;
        }

        return false;
    }

    invert(): false | ICriterion {
        return this.factory.isOdd();
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

        return IIsEvenCriterion.is(other);
    }

    subtractFrom(other: ICriterion): boolean | ICriterion {
        if (IOrCriterion.is(other) || IAndCriterion.is(other)) {
            return other.minus(this);
        } else if (IIsEvenCriterion.is(other)) {
            return true;
        }

        return false;
    }

    override toString(): string {
        return "even";
    }
}

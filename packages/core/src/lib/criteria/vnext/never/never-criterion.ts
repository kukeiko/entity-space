import { CriterionBase } from "../criterion-base";
import { ICriterion, ICriterion$ } from "../criterion.interface";
import { IEntityCriteriaFactory } from "../entity-criteria-factory.interface";
import { INeverCriterion, INeverCriterion$ } from "./never-criterion.interface";

export class NeverCriterion extends CriterionBase implements INeverCriterion {
    constructor({ factory }: { factory: IEntityCriteriaFactory }) {
        super();
        this.factory = factory;
    }

    readonly [ICriterion$] = true;
    readonly [INeverCriterion$] = true;
    private readonly factory: IEntityCriteriaFactory;

    equivalent(other: ICriterion): boolean {
        return this.subtractFrom(other) === true && other.subtractFrom(this) === true;
    }

    intersect(_: ICriterion): false | ICriterion {
        return false;
    }

    invert(): false | ICriterion {
        return this.factory.all();
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

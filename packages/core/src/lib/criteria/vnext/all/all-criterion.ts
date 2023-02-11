import { CriterionBase } from "../criterion-base";
import { ICriterion, ICriterion$ } from "../criterion.interface";
import { IEntityCriteriaFactory } from "../entity-criteria-factory.interface";
import { IAllCriterion, IAllCriterion$ } from "./all-criterion.interface";

export class AllCriterion extends CriterionBase implements IAllCriterion {
    constructor({ factory }: { factory: IEntityCriteriaFactory }) {
        super();
        this.factory = factory;
    }

    readonly [ICriterion$] = true;
    readonly [IAllCriterion$] = true;
    private readonly factory: IEntityCriteriaFactory;

    equivalent(other: ICriterion): boolean {
        return this.subtractFrom(other) === true && other.subtractFrom(this) === true;
    }

    intersect(other: ICriterion): false | ICriterion {
        return other;
    }

    invert(): false | ICriterion {
        return this.factory.none();
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

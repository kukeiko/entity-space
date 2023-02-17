import { CriterionBase } from "../criterion-base";
import { ICriterion, ICriterion$ } from "../criterion.interface";
import { IEntityCriteriaTools } from "../entity-criteria-tools.interface";
import { ISomeCriterion, ISomeCriterion$ } from "./some-criterion.interface";

export class SomeCriterion extends CriterionBase implements ISomeCriterion {
    constructor({ criterion, tools }: { criterion: ICriterion; tools: IEntityCriteriaTools }) {
        super();
        this.criterion = criterion;
        this.factory = tools;
    }

    readonly [ISomeCriterion$] = true;
    readonly [ICriterion$] = true;
    private readonly criterion: ICriterion;
    private readonly factory: IEntityCriteriaTools;

    getCriterion(): ICriterion {
        return this.criterion;
    }

    equivalent(other: ICriterion): boolean {
        return this.subtractFrom(other) === true && other.subtractFrom(this) === true;
    }

    intersect(other: ICriterion): false | ICriterion {
        if (!ISomeCriterion.is(other)) {
            return false;
        }

        const intersected = this.criterion.intersect(other.getCriterion());

        if (typeof intersected == "boolean") {
            return intersected;
        }

        return this.factory.some(intersected);
    }

    invert(): false | ICriterion {
        return false;
    }

    contains(value: unknown): boolean {
        if (!Array.isArray(value)) {
            return false;
        }

        return value.some(item => this.criterion.contains(item));
    }

    merge(other: ICriterion): false | ICriterion {
        return false;
    }

    minus(other: ICriterion): boolean | ICriterion {
        return false;
    }

    override simplify(): ICriterion {
        const simplified = this.criterion.simplify();

        if (this.factory.isSomeCriterion(simplified) || this.factory.isAllCriterion(simplified)) {
            return simplified;
        }

        return this;
    }

    // [todo] some reduction cases were missing - seems like i was sloppy? figure out if there are more,
    // and not only here, but in all criterion implementations
    subtractFrom(other: ICriterion): boolean | ICriterion {
        if (!ISomeCriterion.is(other)) {
            return false;
        }

        const subtracted = this.criterion.subtractFrom(other.getCriterion());

        if (typeof subtracted == "boolean") {
            return subtracted;
        }

        return this.factory.some(subtracted);
    }

    override toString(): string {
        return `some(${this.criterion})`;
    }
}

import { CriterionBase } from "../criterion-base";
import { ICriterion, ICriterion$ } from "../criterion.interface";
import { IEntityCriteriaTools } from "../entity-criteria-tools.interface";
import { IEveryCriterion, IEveryCriterion$ } from "./every-criterion.interface";

export class EveryCriterion extends CriterionBase implements IEveryCriterion {
    constructor({ criterion, tools }: { criterion: ICriterion; tools: IEntityCriteriaTools }) {
        super();
        this.criterion = criterion;
        this.tools = tools;
    }

    readonly [IEveryCriterion$] = true;
    readonly [ICriterion$] = true;
    private readonly criterion: ICriterion;
    private readonly tools: IEntityCriteriaTools;

    getCriterion(): ICriterion {
        return this.criterion;
    }

    equivalent(other: ICriterion): boolean {
        return this.subtractFrom(other) === true && other.subtractFrom(this) === true;
    }

    intersect(other: ICriterion): false | ICriterion {
        // [todo] implement
        return false;
    }

    invert(): false | ICriterion {
        // [todo] implement
        return false;
    }

    contains(value: unknown): boolean {
        if (!Array.isArray(value)) {
            return false;
        }

        return value.every(item => this.criterion.contains(item));
    }

    merge(other: ICriterion): false | ICriterion {
        // [todo] implement
        return false;
    }

    minus(other: ICriterion): boolean | ICriterion {
        // [todo] implement
        return false;
    }

    override simplify(): ICriterion {
        const simplified = this.criterion.simplify();

        if (this.tools.isEveryCriterion(simplified) || this.tools.isAllCriterion(simplified)) {
            return simplified;
        }

        return this;
    }

    // [todo] some reduction cases were missing - seems like i was sloppy? figure out if there are more,
    // and not only here, but in all criterion implementations
    subtractFrom(other: ICriterion): boolean | ICriterion {
        // [todo] implement
        return false;
    }

    override toString(): string {
        return `every(${this.criterion})`;
    }
}

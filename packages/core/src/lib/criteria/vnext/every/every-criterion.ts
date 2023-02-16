import { Null, Primitive } from "@entity-space/utils";
import { CriterionBase } from "../criterion-base";
import { ICriterion, ICriterion$ } from "../criterion.interface";
import { IEntityCriteriaFactory } from "../entity-criteria-factory.interface";
import { IEveryCriterion, IEveryCriterion$ } from "./every-criterion.interface";

type PrimitiveValue = ReturnType<Primitive | typeof Null>;

export class EveryCriterion extends CriterionBase implements IEveryCriterion {
    constructor({ criterion, factory }: { criterion: ICriterion; factory: IEntityCriteriaFactory }) {
        super();
        this.criterion = criterion;
        this.factory = factory;
    }

    readonly [IEveryCriterion$] = true;
    readonly [ICriterion$] = true;
    private readonly criterion: ICriterion;
    private readonly factory: IEntityCriteriaFactory;

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

        if (this.factory.isEveryCriterion(simplified) || this.factory.isAllCriterion(simplified)) {
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

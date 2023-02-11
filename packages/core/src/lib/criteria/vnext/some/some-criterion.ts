import { Null, Primitive } from "@entity-space/utils";
import { IAndCriterion } from "../and/and-criterion.interface";
import { CriterionBase } from "../criterion-base";
import { ICriterion, ICriterion$ } from "../criterion.interface";
import { IEntityCriteriaFactory } from "../entity-criteria-factory.interface";
import { IInArrayCriterion } from "../in-array/in-array-criterion.interface";
import { IOrCriterion } from "../or/or-criterion.interface";
import { ISomeCriterion, ISomeCriterion$ } from "./some-criterion.interface";

type PrimitiveValue = ReturnType<Primitive | typeof Null>;

export class SomeCriterion extends CriterionBase implements ISomeCriterion {
    constructor({ criterion, factory }: { criterion: ICriterion; factory: IEntityCriteriaFactory }) {
        super();
        this.criterion = criterion;
        this.factory = factory;
    }

    readonly [ISomeCriterion$] = true;
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

import { Null, Primitive } from "@entity-space/utils";
import { CriterionBase } from "../criterion-base";
import { ICriterion, ICriterion$ } from "../criterion.interface";
import { IEntityCriteriaFactory } from "../entity-criteria-factory.interface";
import { INotEqualsCriterion, INotEqualsCriterion$ } from "./not-equals-criterion.interface";

type PrimitiveValue = ReturnType<Primitive | typeof Null>;

export class NotEqualsCriterion extends CriterionBase implements INotEqualsCriterion {
    constructor({ value, factory }: { value: PrimitiveValue; factory: IEntityCriteriaFactory }) {
        super();
        this.value = value;
        this.factory = factory;
    }

    readonly [INotEqualsCriterion$] = true;
    readonly [ICriterion$] = true;
    private readonly value: PrimitiveValue;
    private readonly factory: IEntityCriteriaFactory;

    getValue(): PrimitiveValue {
        return this.value;
    }

    equivalent(other: ICriterion): boolean {
        return this.subtractFrom(other) === true && other.subtractFrom(this) === true;
    }

    intersect(other: ICriterion): false | ICriterion {
        return this.merge(other);
    }

    invert(): false | ICriterion {
        return this.factory.equals(this.value);
    }

    contains(value: unknown): boolean {
        return value !== this.value;
    }

    merge(other: ICriterion): false | ICriterion {
        if (INotEqualsCriterion.is(other) && this.value === other.getValue()) {
            return this;
        }

        return false;
    }

    // [todo] some reduction cases were missing - seems like i was sloppy? figure out if there are more,
    // and not only here, but in all criterion implementations
    minus(other: ICriterion): boolean | ICriterion {
        if (INotEqualsCriterion.is(other) && this.value === other.getValue()) {
            return true;
        }

        return false;
    }

    // [todo] some reduction cases were missing - seems like i was sloppy? figure out if there are more,
    // and not only here, but in all criterion implementations
    subtractFrom(other: ICriterion): boolean | ICriterion {
        if (INotEqualsCriterion.is(other) && this.value === other.getValue()) {
            return true;
        }

        return false;
    }

    override toString(): string {
        if (this.value === null) {
            return "!null";
        } else if (typeof this.value === "string") {
            return `!"${this.value}"`;
        }

        return `!${this.value}`;
    }
}

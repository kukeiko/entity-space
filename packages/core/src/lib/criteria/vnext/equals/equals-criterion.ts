import { Null, Primitive } from "@entity-space/utils";
import { IAndCriterion } from "../and/and-criterion.interface";
import { CriterionBase } from "../criterion-base";
import { ICriterion, ICriterion$ } from "../criterion.interface";
import { IEntityCriteriaFactory } from "../entity-criteria-factory.interface";
import { IInArrayCriterion } from "../in-array/in-array-criterion.interface";
import { IOrCriterion } from "../or/or-criterion.interface";
import { IEqualsCriterion, IEqualsCriterion$ } from "./equals-criterion.interface";

type PrimitiveValue = ReturnType<Primitive | typeof Null>;

export class EqualsCriterion extends CriterionBase implements IEqualsCriterion {
    constructor({ value, factory }: { value: PrimitiveValue; factory: IEntityCriteriaFactory }) {
        super();
        this.value = value;
        this.factory = factory;
    }

    readonly [IEqualsCriterion$] = true;
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
        if (other.contains(this.value)) {
            return this;
        }

        return false;
    }

    invert(): false | ICriterion {
        return this.factory.notEquals(this.value);
    }

    contains(value: unknown): boolean {
        return value === this.value;
    }

    merge(other: ICriterion): false | ICriterion {
        if (IEqualsCriterion.is(other)) {
            if (this.value === other.getValue()) {
                return this;
            } else {
                return this.factory.inArray([this.value, other.getValue()]);
            }
        } else if (IInArrayCriterion.is(other)) {
            if (other.contains(this.value)) {
                return other;
            } else {
                // [todo] type assertion
                return this.factory.inArray([...other.getValues(), this.value] as any);
            }
        }

        return false;
    }

    minus(other: ICriterion): boolean | ICriterion {
        if (other.contains(this.value)) {
            return true;
        }

        return false;
    }

    // [todo] some reduction cases were missing - seems like i was sloppy? figure out if there are more,
    // and not only here, but in all criterion implementations
    subtractFrom(other: ICriterion): boolean | ICriterion {
        if (IOrCriterion.is(other) || IAndCriterion.is(other)) {
            // [todo] added this case - write test for it
            return other.minus(this);
        } else if (IEqualsCriterion.is(other)) {
            return this.value === other.getValue();
        } else if (IInArrayCriterion.is(other) && other.contains(this.value)) {
            // [todo] added this case - write test for it
            const withoutMyValue = new Set(other.getValues());
            withoutMyValue.delete(this.getValue());

            if (withoutMyValue.size === 0) {
                return true;
            }

            // [todo] type assertion
            return this.factory.inArray(withoutMyValue as any);
        }

        return false;
    }

    override toString(): string {
        if (this.value === null) {
            return "null";
        } else if (typeof this.value === "string") {
            return `"${this.value}"`;
        }

        return this.value.toString();
    }
}

import { Null, Primitive, subtractSets } from "@entity-space/utils";
import { IAndCriterion } from "../and/and-criterion.interface";
import { CriterionBase } from "../criterion-base";
import { ICriterion, ICriterion$ } from "../criterion.interface";
import { IEntityCriteriaFactory } from "../entity-criteria-factory.interface";
import { IInArrayCriterion } from "../in-array/in-array-criterion.interface";
import { IOrCriterion } from "../or/or-criterion.interface";
import { INotInArrayCriterion, INotInArrayCriterion$ } from "./not-in-array-criterion.interface";

type PrimitiveValue = ReturnType<Primitive | typeof Null>;

export class NotInArrayCriterion extends CriterionBase implements INotInArrayCriterion {
    constructor({ values, factory }: { values: ReadonlySet<PrimitiveValue>; factory: IEntityCriteriaFactory }) {
        super();
        this.values = values;
        this.factory = factory;
    }

    readonly [ICriterion$] = true;
    readonly [INotInArrayCriterion$] = true;
    private readonly factory: IEntityCriteriaFactory;
    private readonly values: ReadonlySet<PrimitiveValue>;

    getValues(): PrimitiveValue[] {
        return Array.from(this.values);
    }

    equivalent(other: ICriterion): boolean {
        return this.subtractFrom(other) === true && other.subtractFrom(this) === true;
    }

    intersect(other: ICriterion): false | ICriterion {
        return this.merge(other);
    }

    invert(): false | ICriterion {
        return this.factory.inArray(this.values);
    }

    contains(value: unknown): boolean {
        return !this.values.has(value as any);
    }

    merge(other: ICriterion): false | ICriterion {
        if (INotInArrayCriterion.is(other)) {
            return this.factory.notInArray([...this.values, ...other.getValues()]);
        }

        throw new Error("Method not implemented.");
    }

    minus(other: ICriterion): boolean | ICriterion {
        throw new Error("Method not implemented.");
    }

    subtractFrom(other: ICriterion): boolean | ICriterion {
        if (IOrCriterion.is(other) || IAndCriterion.is(other)) {
            return other.minus(this);
        } else if (IInArrayCriterion.is(other)) {
            const copy = new Set(other.getValues());

            for (const value of other.getValues()) {
                if (!this.values.has(value)) {
                    copy.delete(value);
                }
            }

            if (copy.size === other.getValues().length) {
                return false;
            } else if (copy.size === 0) {
                return true;
            } else {
                return this.factory.inArray(copy);
            }
        } else if (INotInArrayCriterion.is(other)) {
            const remaining = subtractSets(this.values, new Set(other.getValues()));
            if (remaining.size === 0) {
                return true;
            }

            return this.factory.inArray(remaining);
        }

        return false;
    }

    override toString(): string {
        return `!{${Array.from(this.values)
            .map(value => {
                if (value === null) return "null";
                if (typeof value === "string") return `"${value}"`;

                return value.toString();
            })
            .join(", ")}}`;
    }
}

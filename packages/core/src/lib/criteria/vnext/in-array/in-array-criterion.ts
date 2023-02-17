import { Null, Primitive } from "@entity-space/utils";
import { IAndCriterion } from "../and/and-criterion.interface";
import { CriterionBase } from "../criterion-base";
import { ICriterion, ICriterion$ } from "../criterion.interface";
import { IEntityCriteriaTools } from "../entity-criteria-tools.interface";
import { IEqualsCriterion } from "../equals/equals-criterion.interface";
import { IInNumberRangeCriterion } from "../in-range/in-number-range-criterion.interface";
import { INotInArrayCriterion } from "../not-in-array/not-in-array-criterion.interface";
import { IOrCriterion } from "../or/or-criterion.interface";
import { IInArrayCriterion, IInArrayCriterion$ } from "./in-array-criterion.interface";

type PrimitiveValue = ReturnType<Primitive | typeof Null>;

export class InArrayCriterion extends CriterionBase implements IInArrayCriterion {
    constructor({ values, tools }: { values: ReadonlySet<PrimitiveValue>; tools: IEntityCriteriaTools }) {
        super();
        this.values = values;
        this.tools = tools;
    }

    readonly [ICriterion$] = true;
    readonly [IInArrayCriterion$] = true;
    private readonly tools: IEntityCriteriaTools;
    private readonly values: ReadonlySet<PrimitiveValue>;

    getValues(): PrimitiveValue[] {
        return Array.from(this.values);
    }

    equivalent(other: ICriterion): boolean {
        return this.subtractFrom(other) === true && other.subtractFrom(this) === true;
    }

    intersect(other: ICriterion): false | ICriterion {
        const intersection = Array.from(this.values).filter(value => other.contains(value));

        if (!intersection.length) {
            return false;
        } else if (intersection.length === 1) {
            return this.tools.equals(intersection[0]);
        } else {
            return this.tools.inArray(intersection);
        }
    }

    invert(): false | ICriterion {
        return this.tools.notInArray(this.values);
    }

    contains(value: unknown): boolean {
        // [todo] type assertion
        return this.values.has(value as any);
    }

    merge(other: ICriterion): false | ICriterion {
        if (IInArrayCriterion.is(other)) {
            return this.tools.inArray([...this.values, ...other.getValues()]);
        } else if (IEqualsCriterion.is(other)) {
            return this.tools.inArray([...this.values, other.getValue()]);
        }

        return false;
    }

    minus(other: ICriterion): boolean | ICriterion {
        const values = Array.from(this.values);
        const open = values.filter(value => !other.contains(value));

        if (!open.length) {
            return true;
        } else if (open.length !== values.length) {
            return this.tools.inArray(open);
        } else {
            return false;
        }
    }

    override simplify(): ICriterion {
        if (!this.values.size) {
            return this.tools.all();
        }

        return this;
    }

    subtractFrom(other: ICriterion): boolean | ICriterion {
        if (IOrCriterion.is(other) || IAndCriterion.is(other)) {
            return other.minus(this);
        } else if (IInArrayCriterion.is(other)) {
            const copy = new Set(other.getValues());

            for (const value of this.values) {
                copy.delete(value);
            }

            if (copy.size === other.getValues().length) {
                return false;
            } else if (copy.size === 0) {
                return true;
            } else {
                return this.tools.inArray(copy);
            }
        } else if (INotInArrayCriterion.is(other)) {
            const merged = new Set([...other.getValues(), ...this.values]);

            return this.tools.notInArray(merged);
        } else if (IInNumberRangeCriterion.is(other)) {
            let otherFrom = other.getFrom();
            let otherTo = other.getTo();
            let didReduce = false;

            // [todo] get rid of any
            if (otherFrom?.op === ">=" && this.values.has(otherFrom.value as any)) {
                otherFrom = { op: ">", value: otherFrom.value };
                didReduce = true;
            }

            // [todo] get rid of any
            if (otherTo?.op === "<=" && this.values.has(otherTo.value as any)) {
                otherTo = { op: "<", value: otherTo.value };
                didReduce = true;
            }

            if (didReduce) {
                return this.tools.inRange(otherFrom?.value, otherTo?.value, [
                    otherFrom?.op === ">=",
                    otherTo?.op === "<=",
                ]);
            }
        } else if (IEqualsCriterion.is(other) && this.values.has(other.getValue())) {
            return true;
        }

        return false;
    }

    override toString(): string {
        return `{${Array.from(this.values)
            .map(value => {
                if (value === null) return "null";
                if (typeof value === "string") return `"${value}"`;

                return value.toString();
            })
            .join(", ")}}`;
    }
}

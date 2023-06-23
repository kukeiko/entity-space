import { Null, Primitive, subtractSets } from "@entity-space/utils";
import { intersection } from "lodash";
import { CriterionBase } from "../criterion-base";
import { ICriterion, ICriterion$ } from "../criterion.interface";
import { IEntityCriteriaTools } from "../entity-criteria-tools.interface";
import { INotInArrayCriterion, INotInArrayCriterion$ } from "./not-in-array-criterion.interface";

type PrimitiveValue = ReturnType<Primitive | typeof Null>;

export class NotInArrayCriterion extends CriterionBase implements INotInArrayCriterion {
    constructor({ values, tools }: { values: ReadonlySet<PrimitiveValue>; tools: IEntityCriteriaTools }) {
        super();
        this.values = values;
        this.tools = tools;
    }

    readonly [ICriterion$] = true;
    readonly [INotInArrayCriterion$] = true;
    private readonly tools: IEntityCriteriaTools;
    private readonly values: ReadonlySet<PrimitiveValue>;

    getValues(): PrimitiveValue[] {
        return Array.from(this.values);
    }

    equivalent(other: ICriterion): boolean {
        return this.subtractFrom(other) === true && other.subtractFrom(this) === true;
    }

    intersect(other: ICriterion): false | ICriterion {
        if (this.tools.isNotInArrayCriterion(other)) {
            return this.tools.notInArray([...this.values, ...other.getValues()]);
        } else if (this.tools.isInArrayCriterion(other)) {
            const intersected = other.getValues().filter(value => !this.values.has(value));

            if (intersected.length) {
                return this.tools.inArray(intersected);
            }
        }

        return false;
    }

    invert(): false | ICriterion {
        return this.tools.inArray(this.values);
    }

    contains(value: unknown): boolean {
        return !this.values.has(value as any);
    }

    merge(other: ICriterion): false | ICriterion {
        if (this.tools.isNotInArrayCriterion(other)) {
            const intersected = intersection(this.getValues(), other.getValues());

            if (intersected.length) {
                return this.tools.notInArray(intersected);
            } else {
                return this.tools.all();
            }
        } else if (this.tools.isNotEqualsCriterion(other)) {
            if (this.values.has(other.getValue())) {
                return other;
            } else {
                return this.tools.all();
            }
        } else if (this.tools.isInArrayCriterion(other)) {
            const otherValues = new Set(other.getValues());
            const remainingValues = this.getValues().filter(value => !otherValues.has(value));

            if (remainingValues.length) {
                return this.tools.notInArray(remainingValues);
            } else {
                return this.tools.all();
            }
        } else if (this.tools.isEqualsCriterion(other)) {
            if (this.values.has(other.getValue())) {
                const values = new Set(this.values);
                values.delete(other.getValue());

                if (values.size === 0) {
                    return this.tools.all();
                } else {
                    return this.tools.notInArray(values);
                }
            }
        }

        return false;
    }

    minus(other: ICriterion): boolean | ICriterion {
        throw new Error("Method not implemented.");
    }

    subtractFrom(other: ICriterion): boolean | ICriterion {
        if (this.tools.isOrCriterion(other) || this.tools.isAndCriterion(other)) {
            return other.minus(this);
        } else if (this.tools.isInArrayCriterion(other)) {
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
                return this.tools.inArray(copy);
            }
        } else if (this.tools.isNotInArrayCriterion(other)) {
            const remaining = subtractSets(this.values, new Set(other.getValues()));
            if (remaining.size === 0) {
                return true;
            }

            return this.tools.inArray(remaining);
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

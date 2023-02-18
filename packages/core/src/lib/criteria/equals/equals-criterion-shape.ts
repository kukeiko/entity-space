import { isPrimitiveOrNull, Null, Primitive } from "@entity-space/utils";
import { ICriterionShape, ICriterionShape$ } from "../criterion-shape.interface";
import { ICriterion } from "../criterion.interface";
import { IEntityCriteriaTools } from "../entity-criteria-tools.interface";
import { getPrimitiveTypeName } from "../get-primitive-type-name.fn";
import { reshapeOrCriteria } from "../reshape-or-criteria.fn";
import { ReshapedCriterion } from "../reshaped-criterion";
import { IEqualsCriterion } from "./equals-criterion.interface";

export class EqualsCriterionShape<T extends Primitive | typeof Null>
    implements ICriterionShape<IEqualsCriterion<T>, ReturnType<T>>
{
    static create<T extends Primitive | typeof Null>(
        tools: IEntityCriteriaTools,
        valueTypes?: T[]
    ): EqualsCriterionShape<T> {
        return new EqualsCriterionShape({
            valueTypes: valueTypes ?? ([Number, String, Boolean, Null] as T[]),
            tools: tools,
        });
    }

    constructor({ valueTypes, tools }: { valueTypes: T[]; tools: IEntityCriteriaTools }) {
        this.valueTypes = valueTypes;
        this.tools = tools;
    }

    readonly [ICriterionShape$] = true;
    private readonly valueTypes: readonly T[];
    private readonly tools: IEntityCriteriaTools;

    private valueMatchesType(value: unknown): value is ReturnType<T> {
        return isPrimitiveOrNull(value, this.valueTypes.slice());
    }

    read(criterion: IEqualsCriterion<T>): ReturnType<T> {
        // [todo] should check value type
        return criterion.getValue();
    }

    reshape(criterion: ICriterion): false | ReshapedCriterion<IEqualsCriterion<T>> {
        if (this.tools.isEqualsCriterion(criterion)) {
            if (this.valueMatchesType(criterion.getValue())) {
                return new ReshapedCriterion([criterion]);
            } else {
                return false;
            }
        } else if (this.tools.isInArrayCriterion(criterion)) {
            const values = criterion
                .getValues()
                .filter((value): value is ReturnType<T> => this.valueMatchesType(value));

            if (values.length) {
                const valuesSet = new Set(values);
                // [todo] type assertion
                const openValues = Array.from(criterion.getValues()).filter(value => !valuesSet.has(value as any));
                const open = openValues.length > 0 ? [this.tools.inArray(openValues as any)] : [];
                const remapped = values.map(value => this.tools.equals(value));

                return new ReshapedCriterion(remapped, open);
            }
        } else if (this.tools.isOrCriterion(criterion)) {
            return reshapeOrCriteria(this, criterion);
        }

        return false;
    }

    toString(): string {
        return `${this.valueTypes.map(getPrimitiveTypeName).join(" | ")}`;
    }
}

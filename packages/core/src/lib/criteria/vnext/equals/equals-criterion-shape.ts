import { isPrimitiveOrNull, Null, Primitive } from "@entity-space/utils";
import { ICriterionShape, ICriterionShape$ } from "../criterion-shape.interface";
import { ICriterion } from "../criterion.interface";
import { IEntityCriteriaFactory } from "../entity-criteria-factory.interface";
import { getPrimitiveTypeName } from "../get-primitive-type-name.fn";
import { IInArrayCriterion } from "../in-array/in-array-criterion.interface";
import { IOrCriterion } from "../or/or-criterion.interface";
import { reshapeOrCriteria } from "../reshape-or-criteria.fn";
import { ReshapedCriterion } from "../reshaped-criterion";
import { IEqualsCriterion } from "./equals-criterion.interface";

export class EqualsCriterionShape<T extends Primitive | typeof Null>
    implements ICriterionShape<IEqualsCriterion<T>, ReturnType<T>>
{
    static create<T extends Primitive | typeof Null>(
        factory: IEntityCriteriaFactory,
        valueTypes?: T[]
    ): EqualsCriterionShape<T> {
        return new EqualsCriterionShape({
            valueTypes: valueTypes ?? ([Number, String, Boolean, Null] as T[]),
            factory,
        });
    }

    constructor({ valueTypes, factory }: { valueTypes: T[]; factory: IEntityCriteriaFactory }) {
        this.valueTypes = valueTypes;
        this.factory = factory;
    }

    readonly [ICriterionShape$] = true;
    private readonly valueTypes: readonly T[];
    private readonly factory: IEntityCriteriaFactory;

    private valueMatchesType(value: unknown): value is ReturnType<T> {
        return isPrimitiveOrNull(value, this.valueTypes.slice());
    }

    read(criterion: IEqualsCriterion<T>): ReturnType<T> {
        // [todo] should check value type
        return criterion.getValue();
    }

    reshape(criterion: ICriterion): false | ReshapedCriterion<IEqualsCriterion<T>> {
        if (IEqualsCriterion.is(criterion)) {
            if (this.valueMatchesType(criterion.getValue())) {
                return new ReshapedCriterion([criterion]);
            } else {
                return false;
            }
        } else if (IInArrayCriterion.is(criterion)) {
            const values = criterion
                .getValues()
                .filter((value): value is ReturnType<T> => this.valueMatchesType(value));

            if (values.length) {
                const valuesSet = new Set(values);
                // [todo] type assertion
                const openValues = Array.from(criterion.getValues()).filter(value => !valuesSet.has(value as any));
                const open = openValues.length > 0 ? [this.factory.inArray(openValues as any)] : [];
                const remapped = values.map(value => this.factory.equals(value));

                return new ReshapedCriterion(remapped, open);
            }
        } else if (IOrCriterion.is(criterion)) {
            return reshapeOrCriteria(this, criterion);
        }

        return false;
    }

    toString(): string {
        return `${this.valueTypes.map(getPrimitiveTypeName).join(" | ")}`;
    }
}

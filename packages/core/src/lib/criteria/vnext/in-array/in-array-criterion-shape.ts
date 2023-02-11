import { isPrimitiveOrNull, Null, Primitive } from "@entity-space/utils";
import { partition, unzip } from "lodash";
import { ICriterionShape, ICriterionShape$ } from "../criterion-shape.interface";
import { ICriterion } from "../criterion.interface";
import { IEntityCriteriaFactory } from "../entity-criteria-factory.interface";
import { IEqualsCriterion } from "../equals/equals-criterion.interface";
import { getPrimitiveTypeName } from "../get-primitive-type-name.fn";
import { IOrCriterion } from "../or/or-criterion.interface";
import { reshapeOrCriteria } from "../reshape-or-criteria.fn";
import { ReshapedCriterion } from "../reshaped-criterion";
import { InArrayCriterion } from "./in-array-criterion";
import { IInArrayCriterion } from "./in-array-criterion.interface";

// export type SetCriterionShapeType = [Primitive | typeof Null] | [(Primitive | typeof Null)[]];

export class InArrayCriterionShape<T extends Primitive | typeof Null>
    implements ICriterionShape<IInArrayCriterion, ReturnType<T>[]>
{
    static create<T extends Primitive | typeof Null>(
        valueTypes: T[],
        factory: IEntityCriteriaFactory
    ): InArrayCriterionShape<T> {
        return new InArrayCriterionShape({ valueTypes, factory });
    }

    constructor({ valueTypes, factory }: { valueTypes: T[]; factory: IEntityCriteriaFactory }) {
        this.valueTypes = valueTypes;
        this.factory = factory;
    }

    readonly [ICriterionShape$] = true;
    private readonly valueTypes: readonly T[];
    private readonly factory: IEntityCriteriaFactory;

    read(criterion: IInArrayCriterion): ReturnType<T>[] {
        return criterion.getValues() as ReturnType<T>[];
    }

    reshape(criterion: ICriterion): false | ReshapedCriterion<IInArrayCriterion> {
        if (IInArrayCriterion.is(criterion)) {
            return this.reshapeInArrayCriterion(criterion);
        } else if (IEqualsCriterion.is(criterion)) {
            return this.reshapeEqualsValueCriterion(criterion);
        } else if (IOrCriterion.is(criterion)) {
            return reshapeOrCriteria(this, criterion);
        }

        return false;
    }

    private reshapeInArrayCriterion(criterion: IInArrayCriterion): false | ReshapedCriterion<IInArrayCriterion> {
        const [valuesMatchingType, valuesNotMatchingType] = partition(criterion.getValues(), value =>
            isPrimitiveOrNull(value, this.valueTypes.slice())
        );

        if (!valuesMatchingType.length) {
            return false;
        }

        // [todo] type assertion
        const remapped = this.factory.inArray(valuesMatchingType as any);
        // [todo] type assertion
        const open = valuesNotMatchingType.length ? [this.factory.inArray(valuesNotMatchingType as any)] : [];

        return new ReshapedCriterion([remapped], open);
    }

    private reshapeEqualsValueCriterion(
        criterion: IEqualsCriterion
    ): false | ReshapedCriterion<IInArrayCriterion> {
        const value = criterion.getValue();

        if (!isPrimitiveOrNull(value, this.valueTypes.slice())) {
            return false;
        }

        return new ReshapedCriterion([this.factory.inArray([value])]);
    }

    toString(): string {
        const valueTypeNames = new Set<string>(this.valueTypes.map(getPrimitiveTypeName));

        return `{ ${Array.from(valueTypeNames.values()).sort().join(", ")} }`;
    }
}

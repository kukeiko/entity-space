import { isPrimitiveOrNull, Null, Primitive } from "@entity-space/utils";
import { partition } from "lodash";
import { ICriterionShape, ICriterionShape$ } from "../criterion-shape.interface";
import { ICriterion } from "../criterion.interface";
import { IEntityCriteriaTools } from "../entity-criteria-tools.interface";
import { IEqualsCriterion } from "../equals/equals-criterion.interface";
import { getPrimitiveTypeName } from "../get-primitive-type-name.fn";
import { reshapeOrCriteria } from "../reshape-or-criteria.fn";
import { ReshapedCriterion } from "../reshaped-criterion";
import { IInArrayCriterion } from "./in-array-criterion.interface";

export class InArrayCriterionShape<T extends Primitive | typeof Null>
    implements ICriterionShape<IInArrayCriterion, ReturnType<T>[]>
{
    static create<T extends Primitive | typeof Null>(
        valueTypes: T[],
        tools: IEntityCriteriaTools
    ): InArrayCriterionShape<T> {
        return new InArrayCriterionShape({ valueTypes, tools });
    }

    constructor({ valueTypes, tools }: { valueTypes: T[]; tools: IEntityCriteriaTools }) {
        this.valueTypes = valueTypes;
        this.tools = tools;
    }

    readonly [ICriterionShape$] = true;
    private readonly valueTypes: readonly T[];
    private readonly tools: IEntityCriteriaTools;

    read(criterion: IInArrayCriterion): ReturnType<T>[] {
        return criterion.getValues() as ReturnType<T>[];
    }

    reshape(criterion: ICriterion): false | ReshapedCriterion<IInArrayCriterion> {
        if (this.tools.isInArrayCriterion(criterion)) {
            return this.reshapeInArrayCriterion(criterion);
        } else if (this.tools.isEqualsCriterion(criterion)) {
            return this.reshapeEqualsValueCriterion(criterion);
        } else if (this.tools.isOrCriterion(criterion)) {
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
        const remapped = this.tools.inArray(valuesMatchingType as any);
        // [todo] type assertion
        const open = valuesNotMatchingType.length ? [this.tools.inArray(valuesNotMatchingType as any)] : [];

        return new ReshapedCriterion([remapped], open);
    }

    private reshapeEqualsValueCriterion(criterion: IEqualsCriterion): false | ReshapedCriterion<IInArrayCriterion> {
        const value = criterion.getValue();

        if (!isPrimitiveOrNull(value, this.valueTypes.slice())) {
            return false;
        }

        return new ReshapedCriterion([this.tools.inArray([value])]);
    }

    toString(): string {
        const valueTypeNames = new Set<string>(this.valueTypes.map(getPrimitiveTypeName));

        return `{ ${Array.from(valueTypeNames.values()).sort().join(", ")} }`;
    }
}

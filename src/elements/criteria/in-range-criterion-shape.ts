import { Class, primitiveTypeToString } from "@entity-space/utils";
import { CriterionShape } from "./criterion-shape";
import { InRangeCriterion } from "./in-range-criterion";

export class InRangeCriterionShape<
    T extends typeof String | typeof Number = typeof String | typeof Number,
> extends CriterionShape<InRangeCriterion<ReturnType<T>>> {
    constructor(valueType: T) {
        super();
        this.#valueType = valueType;
    }

    readonly #valueType: T;
    override readonly type = "in-range";

    getValueType(): T {
        return this.#valueType;
    }

    override getCriterionType(): Class<InRangeCriterion<ReturnType<T>>> {
        return InRangeCriterion;
    }

    override toString(): string {
        const typeName = primitiveTypeToString(this.#valueType);

        return `[${typeName}, ${typeName}]`;
    }
}

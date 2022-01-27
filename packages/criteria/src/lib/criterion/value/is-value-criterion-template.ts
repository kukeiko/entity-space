import { PrimitiveIncludingNull } from "@entity-space/utils";

export class IsValueCriterionTemplate<T extends PrimitiveIncludingNull = PrimitiveIncludingNull> {
    constructor(valueTypes: T[]) {
        this.valueTypes = valueTypes;
    }

    private readonly valueTypes: readonly T[];

    // [todo] get rid of this hack
    private readonly op: "is" = "is"; // otherwise typeof NotValueCriterionTemplate === typeof IsValueCriterionTemplate

    getValueTypes(): readonly T[] {
        return this.valueTypes;
    }
}

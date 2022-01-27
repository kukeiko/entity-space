import { PrimitiveIncludingNull } from "@entity-space/utils";

export class InSetCriterionTemplate<T extends PrimitiveIncludingNull = PrimitiveIncludingNull> {
    constructor(valueTypes: T[]) {
        this.valueTypes = valueTypes;
    }

    private readonly valueTypes: readonly T[];

    // [todo] get rid of this hack
    private readonly op: "in-set" = "in-set"; // otherwise typeof IsValueSetCriterionTemplate === typeof IsValueCriterionTemplate

    getValueTypes(): readonly T[] {
        return this.valueTypes;
    }
}

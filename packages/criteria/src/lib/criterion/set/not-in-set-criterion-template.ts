import { PrimitiveIncludingNull } from "@entity-space/utils";

export class NotInSetCriterionTemplate<T extends PrimitiveIncludingNull = PrimitiveIncludingNull> {
    constructor(valueTypes: T[]) {
        this.valueTypes = valueTypes;
    }

    private readonly valueTypes: readonly T[];

    // [todo] get rid of this hack
    private readonly op: "not-in-set" = "not-in-set"; // otherwise typeof IsValueSetCriterionTemplate === typeof IsValueCriterionTemplate

    getValueTypes(): readonly T[] {
        return this.valueTypes;
    }
}

import { PrimitiveIncludingNull } from "@entity-space/utils";

export class NotValueCriterionTemplate<T extends PrimitiveIncludingNull = PrimitiveIncludingNull> {
    constructor(valueTypes: T[]) {
        this.valueTypes = Object.freeze(valueTypes.slice());
    }

    private readonly valueTypes: readonly T[];

    // [todo] get rid of this hack
    private readonly op: "not" = "not"; // otherwise typeof NotValueCriterionTemplate === typeof IsValueCriterionTemplate
}

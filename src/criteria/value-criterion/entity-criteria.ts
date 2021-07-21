import { EntityCriterion } from "./entity-criterion";
import { OrCombinedValueCriteria } from "./or-combined-value-criteria";
import { ValueCriterion } from "./value-criterion";

export class EntityCriteria<T = unknown> extends OrCombinedValueCriteria<T> {
    constructor(items: EntityCriterion<T>[]) {
        super(items);
    }
}

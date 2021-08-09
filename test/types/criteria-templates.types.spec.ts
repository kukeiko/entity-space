import { IsExact } from "conditional-type-checks";
import { InNumberRangeCriterion, InNumberSetCriterion, InstancedCriterionTemplate, NamedCriteria, OrCriteria } from "../../src";

// $ExpectType true
type OrCriteria_OneItem = IsExact<InstancedCriterionTemplate<[typeof OrCriteria, [typeof InNumberRangeCriterion]]>, OrCriteria<InNumberRangeCriterion>>;

// $ExpectType true
type OrCriteria_TwoItems = IsExact<
    InstancedCriterionTemplate<[typeof OrCriteria, [typeof InNumberRangeCriterion, typeof InNumberSetCriterion]]>,
    OrCriteria<InNumberRangeCriterion | InNumberSetCriterion>
>;

// $ExpectType true
type NamedCriteria_OneItem = IsExact<InstancedCriterionTemplate<[typeof NamedCriteria, { foo: [typeof InNumberRangeCriterion] }]>, NamedCriteria<{ foo: InNumberRangeCriterion }>>;

// $ExpectType true
type NamedCriteria_TwoItems = IsExact<
    InstancedCriterionTemplate<[typeof NamedCriteria, { foo: [typeof InNumberRangeCriterion]; bar: [typeof InNumberSetCriterion] }]>,
    NamedCriteria<{ foo: InNumberRangeCriterion; bar: InNumberSetCriterion }>
>;

// $ExpectType true
type NamedCriteria_TwoItems_Nested = IsExact<
    InstancedCriterionTemplate<
        [typeof NamedCriteria, { foo: [typeof InNumberRangeCriterion, [typeof OrCriteria, [typeof InNumberRangeCriterion]]]; bar: [typeof InNumberSetCriterion] }]
    >,
    NamedCriteria<{ foo: InNumberRangeCriterion | OrCriteria<InNumberRangeCriterion>; bar: InNumberSetCriterion }>
>;

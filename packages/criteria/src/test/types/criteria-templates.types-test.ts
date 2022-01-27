import { InSetCriterionTemplate, InSetCriterion } from "@entity-space/criteria";
import { IsExact } from "conditional-type-checks";
import {
    AndCriteria,
    AndCriteriaTemplate,
    InNumberRangeCriterion,
    InstancedCriterionTemplate,
    NamedCriteria,
    NamedCriteriaTemplate,
    OrCriteria,
    OrCriteriaTemplate,
} from "../../lib/criterion";

// $ExpectType true
type OrCriteria_OneItem = IsExact<
    InstancedCriterionTemplate<OrCriteriaTemplate<[typeof InNumberRangeCriterion]>>,
    OrCriteria<InNumberRangeCriterion>
>;

// $ExpectType true
type OrCriteria_TwoItems = IsExact<
    InstancedCriterionTemplate<
        OrCriteriaTemplate<[typeof InNumberRangeCriterion, InSetCriterionTemplate<typeof Number>]>
    >,
    OrCriteria<InNumberRangeCriterion | InSetCriterion<typeof Number>>
>;

// $ExpectType true
type AndCriteria_OneItem = IsExact<
    InstancedCriterionTemplate<AndCriteriaTemplate<[typeof InNumberRangeCriterion]>>,
    AndCriteria<InNumberRangeCriterion>
>;

// $ExpectType true
type AndCriteria_TwoItems = IsExact<
    InstancedCriterionTemplate<
        AndCriteriaTemplate<[typeof InNumberRangeCriterion, InSetCriterionTemplate<typeof Number>]>
    >,
    AndCriteria<InNumberRangeCriterion | InSetCriterion<typeof Number>>
>;

// $ExpectType false
type AndCriteria_IsNot_OrCriteria = IsExact<
    InstancedCriterionTemplate<AndCriteriaTemplate<[typeof InNumberRangeCriterion]>>,
    OrCriteria<InNumberRangeCriterion>
>;

// $ExpectType false
type OrCriteria_IsNot_AndCriteria = IsExact<
    InstancedCriterionTemplate<OrCriteriaTemplate<[typeof InNumberRangeCriterion]>>,
    AndCriteria<InNumberRangeCriterion>
>;

// $ExpectType true
type NamedCriteria_OneItem = IsExact<
    InstancedCriterionTemplate<NamedCriteriaTemplate<{ foo: [typeof InNumberRangeCriterion] }>>,
    NamedCriteria<{ foo: InNumberRangeCriterion }>
>;

// $ExpectType true
type NamedCriteria_TwoItems = IsExact<
    InstancedCriterionTemplate<
        NamedCriteriaTemplate<{
            foo: [typeof InNumberRangeCriterion];
            bar: [InSetCriterionTemplate<typeof Number>];
        }>
    >,
    NamedCriteria<{ foo: InNumberRangeCriterion; bar: InSetCriterion<typeof Number> }>
>;

// $ExpectType true
type NamedCriteria_TwoItems_Nested = IsExact<
    InstancedCriterionTemplate<
        NamedCriteriaTemplate<{
            foo: [typeof InNumberRangeCriterion, OrCriteriaTemplate<[typeof InNumberRangeCriterion]>];
            bar: [InSetCriterionTemplate<typeof Number>];
        }>
    >,
    NamedCriteria<{
        foo: InNumberRangeCriterion | OrCriteria<InNumberRangeCriterion>;
        bar: InSetCriterion<typeof Number>;
    }>
>;

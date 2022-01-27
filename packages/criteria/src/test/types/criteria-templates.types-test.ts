import { IsExact } from "conditional-type-checks";
import { AndCriteria } from "../../lib/criterion/and/and-criteria";
import { AndCriteriaTemplate } from "../../lib/criterion/and/and-criteria-template";
import { InstancedCriterionTemplate } from "../../lib/criterion/criterion-template.types";
import { NamedCriteria } from "../../lib/criterion/named/named-criteria";
import { NamedCriteriaTemplate } from "../../lib/criterion/named/named-criteria-template";
import { OrCriteria } from "../../lib/criterion/or/or-criteria";
import { OrCriteriaTemplate } from "../../lib/criterion/or/or-criteria-template";
import { InNumberRangeCriterion } from "../../lib/criterion/range/in-number-range-criterion";
import { InSetCriterion } from "../../lib/criterion/set/in-set-criterion";
import { InSetCriterionTemplate } from "../../lib/criterion/set/in-set-criterion-template";

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

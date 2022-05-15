import { IsExact } from "conditional-type-checks";
import { AndCriteria } from "../../lib/criterion/and/and-criteria";
import { NamedCriteria } from "../../lib/criterion/named/named-criteria";
import { OrCriteria } from "../../lib/criterion/or/or-criteria";
import { InNumberRangeCriterion } from "../../lib/criterion/range/in-number-range-criterion";
import { InSetCriterion } from "../../lib/criterion/set/in-set-criterion";
import { InRangeCriterionTemplate } from "../../lib/templates/in-range-criterion-template";
import { InSetCriterionTemplate } from "../../lib/templates/in-set-criterion-template";
// import { AndCriteriaTemplate } from "../../lib/templates/and-criteria-template";
import { InstancedCriterionTemplate } from "../../lib/templates/instanced-criterion-template.type";
import { NamedCriteriaTemplate } from "../../lib/templates/named-criteria-template";
import { OrCriteriaTemplate } from "../../lib/templates/or-criteria-template";
// import { NotInSetCriterion } from "../../lib/templates/not-in-set-criterion";
// import { NotInSetCriterionTemplate } from "../../lib/templates/not-in-set-criterion-template";

// $ExpectType true
type OrCriteria_OneItem = IsExact<
    InstancedCriterionTemplate<OrCriteriaTemplate<InRangeCriterionTemplate<typeof Number>>>,
    OrCriteria<InNumberRangeCriterion>
>;

// $ExpectType true
type OrCriteria_TwoItems = IsExact<
    InstancedCriterionTemplate<
        OrCriteriaTemplate<InRangeCriterionTemplate<typeof Number> | InSetCriterionTemplate<typeof Number>>
    >,
    OrCriteria<InNumberRangeCriterion | InSetCriterion<number>>
>;

// $ExpectType_ true
// type AndCriteria_OneItem = IsExact<
//     InstancedCriterionTemplate<AndCriteriaTemplate<[typeof InNumberRangeCriterion]>>,
//     AndCriteria<InNumberRangeCriterion>
// >;

// $ExpectType_ true
// type AndCriteria_TwoItems = IsExact<
//     InstancedCriterionTemplate<
//         AndCriteriaTemplate<[typeof InNumberRangeCriterion, InSetCriterionTemplate<typeof Number>]>
//     >,
//     AndCriteria<InNumberRangeCriterion | InSetCriterion<number>>
// >;

// $ExpectType_ false
// type AndCriteria_IsNot_OrCriteria = IsExact<
//     InstancedCriterionTemplate<AndCriteriaTemplate<[typeof InNumberRangeCriterion]>>,
//     OrCriteria<InNumberRangeCriterion>
// >;

// $ExpectType false
type OrCriteria_IsNot_AndCriteria = IsExact<
    InstancedCriterionTemplate<OrCriteriaTemplate<InRangeCriterionTemplate<typeof Number>>>,
    AndCriteria<InNumberRangeCriterion>
>;

{
    /**
     * named
     */

    // $ExpectType true
    type NamedCriteria_OneItem = IsExact<
        InstancedCriterionTemplate<NamedCriteriaTemplate<{ foo: InRangeCriterionTemplate<typeof Number> }>>,
        NamedCriteria<{ foo: InNumberRangeCriterion }, "foo">
    >;

    // $ExpectType true
    type NamedCriteria_TwoItems = IsExact<
        InstancedCriterionTemplate<
            NamedCriteriaTemplate<{
                foo: InRangeCriterionTemplate<typeof Number>;
                bar: InSetCriterionTemplate<typeof Number>;
            }>
        >,
        NamedCriteria<{ foo: InNumberRangeCriterion; bar: InSetCriterion<number> }, "foo" | "bar">
    >;

    // $ExpectType_ true
    // type NamedCriteria_TwoItems_Nested = IsExact<
    //     InstancedCriterionTemplate<
    //         NamedCriteriaTemplate<{
    //             foo: [typeof InNumberRangeCriterion, OrCriteriaTemplate<InRangeCriterionTemplate<typeof Number>>];
    //             bar: InSetCriterionTemplate<typeof Number>;
    //         }>
    //     >,
    //     NamedCriteria<{
    //         foo: InNumberRangeCriterion | OrCriteria<InNumberRangeCriterion>;
    //         bar: InSetCriterion<number>;
    //     }>
    // >;
}

{
    /**
     * not-in-set
     */
    // $ExpectType_ true
    // type NotInSet_Number = IsExact<
    //     InstancedCriterionTemplate<NotInSetCriterionTemplate<typeof Number>>,
    //     NotInSetCriterion<number>
    // >;
    // // $ExpectType true
    // type NotInSet_Number_String = IsExact<
    //     InstancedCriterionTemplate<NotInSetCriterionTemplate<typeof Number | typeof String>>,
    //     NotInSetCriterion<number | string>
    // >;
    // // $ExpectType true
    // type NotInSet_Number_String_Boolean = IsExact<
    //     InstancedCriterionTemplate<NotInSetCriterionTemplate<typeof Number | typeof String | typeof Boolean>>,
    //     NotInSetCriterion<number | string | boolean>
    // >;
    // // $ExpectType true
    // type NotInSet_Number_String_Boolean_Null = IsExact<
    //     InstancedCriterionTemplate<
    //         NotInSetCriterionTemplate<typeof Number | typeof String | typeof Boolean | (() => null)>
    //     >,
    //     NotInSetCriterion<number | string | boolean | null>
    // >;
    // // $ExpectType false
    // type NotInSet_Number_IsNot_NotInSet_String = IsExact<
    //     InstancedCriterionTemplate<NotInSetCriterionTemplate<typeof Number>>,
    //     NotInSetCriterion<string>
    // >;
}

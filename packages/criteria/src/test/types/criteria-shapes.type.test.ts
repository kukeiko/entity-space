import { IsExact } from "conditional-type-checks";
import { AndCriteria } from "../../lib/criterion/and/and-criteria";
import { NamedCriteria } from "../../lib/criterion/named/named-criteria";
import { OrCriteria } from "../../lib/criterion/or/or-criteria";
import { InNumberRangeCriterion } from "../../lib/criterion/range/in-number-range-criterion";
import { InSetCriterion } from "../../lib/criterion/set/in-set-criterion";
import { InRangeCriterionShape } from "../../lib/templates/in-range-criterion-shape";
import { InSetCriterionShape } from "../../lib/templates/in-set-criterion-shape";
// import { AndCriteriaTemplate } from "../../lib/templates/and-criteria-template";
import { InstancedCriterionShape } from "../../lib/templates/instanced-criterion-shape.type";
import { NamedCriteriaShape } from "../../lib/templates/named-criteria-shape";
import { OrCriteriaShape } from "../../lib/templates/or-criteria-shape";
// import { NotInSetCriterion } from "../../lib/templates/not-in-set-criterion";
// import { NotInSetCriterionTemplate } from "../../lib/templates/not-in-set-criterion-template";

// $ExpectType true
type OrCriteria_OneItem = IsExact<
    InstancedCriterionShape<OrCriteriaShape<InRangeCriterionShape<typeof Number>>>,
    OrCriteria<InNumberRangeCriterion>
>;

// $ExpectType true
type OrCriteria_TwoItems = IsExact<
    InstancedCriterionShape<OrCriteriaShape<InRangeCriterionShape<typeof Number> | InSetCriterionShape<typeof Number>>>,
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
    InstancedCriterionShape<OrCriteriaShape<InRangeCriterionShape<typeof Number>>>,
    AndCriteria<InNumberRangeCriterion>
>;

{
    /**
     * named
     */

    // $ExpectType true
    type NamedCriteria_OneItem = IsExact<
        InstancedCriterionShape<NamedCriteriaShape<{ foo: InRangeCriterionShape<typeof Number> }>>,
        NamedCriteria<{ foo: InNumberRangeCriterion }, "foo">
    >;

    // $ExpectType true
    type NamedCriteria_TwoItems = IsExact<
        InstancedCriterionShape<
            NamedCriteriaShape<{
                foo: InRangeCriterionShape<typeof Number>;
                bar: InSetCriterionShape<typeof Number>;
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

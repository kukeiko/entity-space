import { AndCriteria } from "../../lib/criteria/criterion/and/and-criteria";
import { OrCriteria } from "../../lib/criteria/criterion/or/or-criteria";

{
    /**
     * Types of OrCriteria & AndCriteria should not be assignable to each other so that we can distinguish between them.
     */

    // $ExpectType false
    type TypeOfAndCriteria_AssignableTo_TypeOfOrCriteria = typeof AndCriteria extends typeof OrCriteria ? true : false;

    // $ExpectType false
    type TypeOfOrCriteria_AssignableTo_TypeOfAndCriteria = typeof OrCriteria extends typeof AndCriteria ? true : false;
}

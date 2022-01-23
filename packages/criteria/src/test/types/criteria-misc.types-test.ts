import { AndCriteria, OrCriteria } from "../../lib/criterion";

{
    /**
     * Types of OrCriteria & AndCriteria should not be assignable to each other so that we can distinguish between them.
     */

    // $ExpectType false
    type TypeOfAndCriteria_AssignableTo_TypeOfOrCriteria = typeof AndCriteria extends typeof OrCriteria ? true : false;

    // $ExpectType false
    type TypeOfOrCriteria_AssignableTo_TypeOfAndCriteria = typeof OrCriteria extends typeof AndCriteria ? true : false;
}

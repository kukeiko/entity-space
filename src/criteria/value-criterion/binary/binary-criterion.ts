import { ValueCriterion } from "../value-criterion";

// [todo] think about if we want "is-null", "is-not-null", "is-true" and "is-false" to extend from this
export abstract class BinaryCriterion<T> extends ValueCriterion<T> {}

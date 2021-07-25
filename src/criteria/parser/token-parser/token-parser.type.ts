import { ValueCriterion } from "../../value-criterion";
import { Token } from "../token.contract";

export type TokenParser = Generator<undefined | (() => ValueCriterion), false | (() => ValueCriterion), Token>;

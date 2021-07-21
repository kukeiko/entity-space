import { ValueCriterion } from "../../value-criterion";
import { Token } from "../token.contract";

export type ParseTokenGenerator = Generator<undefined | (() => ValueCriterion), false | (() => ValueCriterion), Token>;

import { ValueCriterion } from "../../value-criterion";
import { Token } from "../token";

export type ParseTokenGenerator = Generator<boolean, false | ValueCriterion, Token>;

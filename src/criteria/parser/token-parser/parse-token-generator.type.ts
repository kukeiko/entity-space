import { ValueCriterion } from "../../value-criterion";
import { Token } from "../token.contract";

export type ParseTokenGenerator = Generator<boolean, false | ValueCriterion, Token>;

import { Token } from "../../lexer/token.contract";
import { Criterion } from "../criterion/criterion";

export type CriterionTokenParser = Generator<undefined | (() => Criterion), false | (() => Criterion), Token>;

import { Token } from "@entity-space/lexer";
import { Criterion } from "../criterion/criterion";

export type CriterionTokenParser = Generator<undefined | (() => Criterion), false | (() => Criterion), Token>;

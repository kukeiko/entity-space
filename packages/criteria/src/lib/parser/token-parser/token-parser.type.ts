import { Token } from "@entity-space/lexer";
import { Criterion } from "../../criterion/criterion";
// [todo] rename to CriteriaTokenParser
export type TokenParser = Generator<undefined | (() => Criterion), false | (() => Criterion), Token>;

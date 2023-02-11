import { Token } from "../../../lexer/token.contract";
import { ICriterion } from "../criterion.interface";

export type CriterionTokenParser = Generator<undefined | (() => ICriterion), false | (() => ICriterion), Token>;

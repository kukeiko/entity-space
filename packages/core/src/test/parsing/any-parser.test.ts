import { any } from "../../lib/criteria/criterion/any/any.fn";
import { anyCriterionTokenParser } from "../../lib/criteria/parser/any-criterion.token-parser";
import { TokenType } from "../../lib/lexer/token-type.enum";
import { token } from "../../lib/lexer/token.fn";
import { itShouldParseTokens } from "./utils";

describe("parse-tokens: any", () => {
    itShouldParseTokens(anyCriterionTokenParser, [token(TokenType.Literal, "any")], any());
});

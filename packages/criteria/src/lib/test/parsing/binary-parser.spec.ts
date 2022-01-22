import { token, TokenType } from "@entity-space/lexer";
import { isEven, isNull, isTrue } from "../../criterion";
import { binaryCriterionTokenParser } from "../../parser";
import { itShouldParseTokens } from "./utils";

describe("parse-tokens: binary", () => {
    itShouldParseTokens(binaryCriterionTokenParser, [token(TokenType.Literal, "is-true")], isTrue(true));
    itShouldParseTokens(binaryCriterionTokenParser, [token(TokenType.Literal, "is-false")], isTrue(false));
    itShouldParseTokens(binaryCriterionTokenParser, [token(TokenType.Literal, "is-even")], isEven(true));
    itShouldParseTokens(binaryCriterionTokenParser, [token(TokenType.Literal, "is-odd")], isEven(false));
    itShouldParseTokens(binaryCriterionTokenParser, [token(TokenType.Literal, "is-null")], isNull(true));
    itShouldParseTokens(binaryCriterionTokenParser, [token(TokenType.Literal, "is-not-null")], isNull(false));
});

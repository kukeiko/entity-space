import { token, TokenType } from "@entity-space/lexer";
import { isEven, isNull, isTrue } from "../../criterion";
import { binaryCriterionTokenParser } from "../../parser";
import { itShouldParseTokens } from "./utils";

describe("parse-tokens: binary", () => {
    itShouldParseTokens(binaryCriterionTokenParser, [token(TokenType.Symbol, "is-true")], isTrue(true));
    itShouldParseTokens(binaryCriterionTokenParser, [token(TokenType.Symbol, "is-false")], isTrue(false));
    itShouldParseTokens(binaryCriterionTokenParser, [token(TokenType.Symbol, "is-even")], isEven(true));
    itShouldParseTokens(binaryCriterionTokenParser, [token(TokenType.Symbol, "is-odd")], isEven(false));
    itShouldParseTokens(binaryCriterionTokenParser, [token(TokenType.Symbol, "is-null")], isNull(true));
    itShouldParseTokens(binaryCriterionTokenParser, [token(TokenType.Symbol, "is-not-null")], isNull(false));
});

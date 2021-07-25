import { binaryCriterionTokenParser, token, TokenType } from "../../parser";
import { isEven, isNull, isTrue } from "../../value-criterion";
import { itShouldParseTokens } from "./utils";

describe("parse-tokens: binary", () => {
    itShouldParseTokens(binaryCriterionTokenParser, [token(TokenType.Symbol, "is-true")], isTrue(true));
    itShouldParseTokens(binaryCriterionTokenParser, [token(TokenType.Symbol, "is-false")], isTrue(false));
    itShouldParseTokens(binaryCriterionTokenParser, [token(TokenType.Symbol, "is-even")], isEven(true));
    itShouldParseTokens(binaryCriterionTokenParser, [token(TokenType.Symbol, "is-odd")], isEven(false));
    itShouldParseTokens(binaryCriterionTokenParser, [token(TokenType.Symbol, "is-null")], isNull(true));
    itShouldParseTokens(binaryCriterionTokenParser, [token(TokenType.Symbol, "is-not-null")], isNull(false));
});

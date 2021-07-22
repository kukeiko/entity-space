import { parseBinaryCriterionGenerator, token, TokenType } from "../../parser";
import { isEven, isNull, isTrue } from "../../value-criterion";
import { itShouldParseTokens } from "./utils";

describe("parse-tokens: binary", () => {
    itShouldParseTokens(parseBinaryCriterionGenerator, [token(TokenType.Symbol, "is-true")], isTrue(true));
    itShouldParseTokens(parseBinaryCriterionGenerator, [token(TokenType.Symbol, "is-false")], isTrue(false));
    itShouldParseTokens(parseBinaryCriterionGenerator, [token(TokenType.Symbol, "is-even")], isEven(true));
    itShouldParseTokens(parseBinaryCriterionGenerator, [token(TokenType.Symbol, "is-odd")], isEven(false));
    itShouldParseTokens(parseBinaryCriterionGenerator, [token(TokenType.Symbol, "is-null")], isNull(true));
    itShouldParseTokens(parseBinaryCriterionGenerator, [token(TokenType.Symbol, "is-not-null")], isNull(false));
});

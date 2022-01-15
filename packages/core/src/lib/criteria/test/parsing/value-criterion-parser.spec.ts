import { isValue, notValue } from "../../criterion/value";
import { token, TokenType, valueCriterionTokenParser } from "../../parser";
import { itShouldParseTokens } from "./utils";

describe("parse-tokens: is <value> / not <value>", () => {
    itShouldParseTokens(
        valueCriterionTokenParser,
        [token(TokenType.Symbol, "is"), token(TokenType.Number, "3")],
        isValue(3)
    );
    itShouldParseTokens(
        valueCriterionTokenParser,
        [token(TokenType.Symbol, "is"), token(TokenType.String, "foo")],
        isValue("foo")
    );

    itShouldParseTokens(
        valueCriterionTokenParser,
        [token(TokenType.Symbol, "not"), token(TokenType.Number, "3")],
        notValue(3)
    );
    itShouldParseTokens(
        valueCriterionTokenParser,
        [token(TokenType.Symbol, "not"), token(TokenType.String, "foo")],
        notValue("foo")
    );
});

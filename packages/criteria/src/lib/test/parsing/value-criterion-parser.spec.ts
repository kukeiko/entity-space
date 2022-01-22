import { token, TokenType } from "@entity-space/lexer";
import { isValue, notValue } from "../../criterion/value";
import { valueCriterionTokenParser } from "../../parser";
import { itShouldParseTokens } from "./utils";

describe("parse-tokens: is <value> / not <value>", () => {
    itShouldParseTokens(
        valueCriterionTokenParser,
        [token(TokenType.Literal, "is"), token(TokenType.Number, "3")],
        isValue(3)
    );
    itShouldParseTokens(
        valueCriterionTokenParser,
        [token(TokenType.Literal, "is"), token(TokenType.String, "foo")],
        isValue("foo")
    );

    itShouldParseTokens(
        valueCriterionTokenParser,
        [token(TokenType.Literal, "not"), token(TokenType.Number, "3")],
        notValue(3)
    );
    itShouldParseTokens(
        valueCriterionTokenParser,
        [token(TokenType.Literal, "not"), token(TokenType.String, "foo")],
        notValue("foo")
    );
});

import { token, TokenType } from "@entity-space/lexer";
import { isValue, notValue } from "../../criterion/value";
import { valueCriterionTokenParser } from "../../parser";
import { fitShouldParseTokens, itShouldParseTokens } from "./utils";

describe("parse-tokens: <value> / !<value>", () => {
    itShouldParseTokens(valueCriterionTokenParser, [token(TokenType.Number, "3")], isValue(3));
    itShouldParseTokens(valueCriterionTokenParser, [token(TokenType.String, "foo")], isValue("foo"));

    fitShouldParseTokens(
        valueCriterionTokenParser,
        [token(TokenType.Special, "!"), token(TokenType.Number, "3")],
        notValue(3)
    );
    itShouldParseTokens(
        valueCriterionTokenParser,
        [token(TokenType.Special, "!"), token(TokenType.String, "foo")],
        notValue("foo")
    );
});

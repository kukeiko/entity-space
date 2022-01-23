import { token, TokenType } from "@entity-space/lexer";
import { isEven, isNull, isTrue } from "../../criterion";
import { isValue, notValue } from "../../criterion/value";
import { valueCriterionTokenParser } from "../../parser";
import { itShouldParseTokens } from "./utils";

describe("parse-tokens: <value> / !<value>", () => {
    itShouldParseTokens(valueCriterionTokenParser, [token(TokenType.Number, "3")], isValue(3));
    itShouldParseTokens(valueCriterionTokenParser, [token(TokenType.String, "foo")], isValue("foo"));

    itShouldParseTokens(
        valueCriterionTokenParser,
        [token(TokenType.Special, "!"), token(TokenType.Number, "3")],
        notValue(3)
    );

    itShouldParseTokens(
        valueCriterionTokenParser,
        [token(TokenType.Special, "!"), token(TokenType.String, "foo")],
        notValue("foo")
    );

    itShouldParseTokens(valueCriterionTokenParser, [token(TokenType.Literal, "true")], isTrue(true));
    itShouldParseTokens(valueCriterionTokenParser, [token(TokenType.Literal, "false")], isTrue(false));
    itShouldParseTokens(valueCriterionTokenParser, [token(TokenType.Literal, "even")], isEven(true));
    itShouldParseTokens(valueCriterionTokenParser, [token(TokenType.Literal, "odd")], isEven(false));
    itShouldParseTokens(valueCriterionTokenParser, [token(TokenType.Literal, "null")], isNull(true));

    itShouldParseTokens(
        valueCriterionTokenParser,
        [token(TokenType.Special, "!"), token(TokenType.Literal, "null")],
        isNull(false)
    );
});

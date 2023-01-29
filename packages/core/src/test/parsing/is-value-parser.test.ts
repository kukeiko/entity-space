import { token, TokenType } from "@entity-space/lexer";
import { isEven } from "../../lib/criteria/criterion/binary/is-even.fn";
import { isValue } from "../../lib/criteria/criterion/value/is-value.fn";
import { notValue } from "../../lib/criteria/criterion/value/not-value.fn";
import { valueCriterionTokenParser } from "../../lib/criteria/parser/value-criterion.token-parser";
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

    itShouldParseTokens(valueCriterionTokenParser, [token(TokenType.Literal, "true")], isValue(true));
    itShouldParseTokens(valueCriterionTokenParser, [token(TokenType.Literal, "false")], isValue(false));
    itShouldParseTokens(valueCriterionTokenParser, [token(TokenType.Literal, "even")], isEven(true));
    itShouldParseTokens(valueCriterionTokenParser, [token(TokenType.Literal, "odd")], isEven(false));
    itShouldParseTokens(valueCriterionTokenParser, [token(TokenType.Literal, "null")], isValue(null));

    itShouldParseTokens(
        valueCriterionTokenParser,
        [token(TokenType.Special, "!"), token(TokenType.Literal, "null")],
        notValue(null)
    );
});

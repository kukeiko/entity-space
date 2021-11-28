import { namedCriteriaTokenParser, token, TokenType } from "../../parser";
import { inRange, matches, or } from "../../criterion";
import { itShouldParseTokens } from "./utils";

describe("parse-tokens: named-criteria", () => {
    itShouldParseTokens(
        namedCriteriaTokenParser,
        [
            token(TokenType.Special, "{"),
            token(TokenType.Symbol, "foo"),
            token(TokenType.Special, ":"),
            token(TokenType.Special, "("),
            token(TokenType.Number, "13"),
            token(TokenType.Special, ","),
            token(TokenType.Number, "37"),
            token(TokenType.Special, "]"),
            token(TokenType.Combinator, "|"),
            token(TokenType.Special, "["),
            token(TokenType.Number, "100"),
            token(TokenType.Special, ","),
            token(TokenType.Number, "200"),
            token(TokenType.Special, ")"),
            token(TokenType.Special, "}"),
        ],
        matches({ foo: or([inRange([13, false], 37), inRange(100, [200, false])]) })
    );

    itShouldParseTokens(
        namedCriteriaTokenParser,
        [
            token(TokenType.Special, "{"),
            token(TokenType.Symbol, "foo"),
            token(TokenType.Special, ":"),
            token(TokenType.Special, "("),
            token(TokenType.Number, "13"),
            token(TokenType.Special, ","),
            token(TokenType.Number, "37"),
            token(TokenType.Special, "]"),
            token(TokenType.Combinator, "|"),
            token(TokenType.Special, "["),
            token(TokenType.Number, "100"),
            token(TokenType.Special, ","),
            token(TokenType.Number, "200"),
            token(TokenType.Special, ")"),
            token(TokenType.Special, ","),
            token(TokenType.Symbol, "bar"),
            token(TokenType.Special, ":"),
            token(TokenType.Special, "["),
            token(TokenType.Number, "100"),
            token(TokenType.Special, ","),
            token(TokenType.Number, "200"),
            token(TokenType.Special, ")"),
            token(TokenType.Special, "}"),
        ],
        matches({ foo: or([inRange([13, false], 37), inRange(100, [200, false])]), bar: inRange(100, [200, false]) })
    );
});

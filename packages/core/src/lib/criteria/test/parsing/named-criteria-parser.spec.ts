import { token, TokenType } from "@entity-space/lexer";
import { inRange, matches, or } from "../../criterion";
import { namedCriteriaTokenParser } from "../../parser";
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
        matches({ foo: or([inRange(13, 37, [false, true]), inRange(100, 200, [true, false])]) })
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
        matches({
            foo: or([inRange(13, 37, [false, true]), inRange(100, 200, [true, false])]),
            bar: inRange(100, 200, [true, false]),
        })
    );
});

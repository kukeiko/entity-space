import { token, TokenType } from "@entity-space/lexer";
import { matches } from "../../criterion/named/matches.fn";
import { or } from "../../criterion/or/or.fn";
import { inRange } from "../../criterion/range/in-range.fn";
import { namedCriteriaTokenParser } from "../../parser";
import { itShouldParseTokens } from "./utils";

describe("parse-tokens: named-criteria", () => {
    itShouldParseTokens(
        namedCriteriaTokenParser,
        [
            token(TokenType.Special, "{"),
            token(TokenType.Literal, "foo"),
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
            token(TokenType.Literal, "foo"),
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
            token(TokenType.Literal, "bar"),
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

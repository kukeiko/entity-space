import { inRange, inSet, or } from "../../criterion";
import { criteriaTokenParser, notBracketedCriteriaTokenParser, token, TokenType } from "../../parser";
import { itShouldParseTokens } from "./utils";

describe("token-parser: value-criteria", () => {
    const terminator = token(TokenType.Special, ";");

    itShouldParseTokens(
        criteriaTokenParser,
        [
            token(TokenType.Special, "("),
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
            token(TokenType.Special, ")"),
        ],
        or([inRange(13, 37, [false, true]), inRange(100, 200, [true, false])])
    );

    itShouldParseTokens(
        criteriaTokenParser,
        [
            token(TokenType.Special, "("),
            token(TokenType.Special, "{"),
            token(TokenType.Number, "1"),
            token(TokenType.Special, "}"),
            token(TokenType.Combinator, "|"),
            token(TokenType.Special, "{"),
            token(TokenType.Number, "2"),
            token(TokenType.Special, "}"),
            token(TokenType.Special, ")"),
        ],
        or([inSet([1]), inSet([2])])
    );

    itShouldParseTokens(
        notBracketedCriteriaTokenParser,
        [
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
            terminator,
        ],
        or([inRange(13, 37, [false, true]), inRange(100, 200, [true, false])])
    );

    itShouldParseTokens(
        notBracketedCriteriaTokenParser,
        [
            token(TokenType.Special, "("),
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
            token(TokenType.Special, ")"),
            terminator,
        ],
        or([inRange(13, 37, [false, true]), inRange(100, 200, [true, false])])
    );

    itShouldParseTokens(
        criteriaTokenParser,
        [
            token(TokenType.Special, "("),
            token(TokenType.Special, "("),
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
            token(TokenType.Special, ")"),
            token(TokenType.Special, ")"),
        ],
        or([inRange(13, 37, [false, true]), inRange(100, 200, [true, false])])
    );
});

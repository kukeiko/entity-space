import { notBracketedCriteriaTokenParser, criteriaTokenParser, token, TokenType } from "../../parser";
import { inRange, inSet, or } from "../../criterion";
import { fitShouldParseTokens, itShouldParseTokens } from "./utils";

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
        or([inRange([13, false], 37), inRange(100, [200, false])])
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
        or([inRange([13, false], 37), inRange(100, [200, false])])
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
        or([inRange([13, false], 37), inRange(100, [200, false])])
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
        or([inRange([13, false], 37), inRange(100, [200, false])])
    );
});

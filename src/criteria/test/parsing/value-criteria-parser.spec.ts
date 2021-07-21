import { parseNotBracketedCriteriaGenerator, parseValueCriteriaGenerator, token, TokenType } from "../../parser";
import { inRange, inSet, or } from "../../value-criterion";
import { itShouldParseTokens } from "./utils";

describe("token-parser: value-criteria", () => {
    const terminator = token(TokenType.Special, ";");

    itShouldParseTokens(
        parseValueCriteriaGenerator,
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
        parseValueCriteriaGenerator,
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
        parseNotBracketedCriteriaGenerator,
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

    // [todo] should actually unpack nested "or" with only 1 item
    itShouldParseTokens(
        parseNotBracketedCriteriaGenerator,
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
        or([or([inRange(13, 37, [false, true]), inRange(100, 200, [true, false])])])
    );

    itShouldParseTokens(
        parseValueCriteriaGenerator,
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
        or([or([inRange(13, 37, [false, true]), inRange(100, 200, [true, false])])])
    );
});
